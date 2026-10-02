import type { Editor } from "@tiptap/core";
import type { Node as PMNode, Schema } from "@tiptap/pm/model";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
// Installed with @tiptap/extension-drag-handle (its peer dependency).
import { NodeRangeSelection } from "@tiptap/extension-node-range";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  updateYFragment,
  yXmlFragmentToProseMirrorRootNode,
} from "@tiptap/y-tiptap";

// "Move to" from the block menu: the selected blocks go to the end of
// another page and leave this one.
//
// The other page is a Yjs document on the collaboration server, like the
// page open here. It's opened for a moment with its own connection, the
// blocks are appended to it, and only once the server has every change are
// they removed here. If anything fails (no access, offline, timeout) the
// blocks stay where they were.

/** The collaboration field TipTap's Collaboration extension uses. */
const FIELD = "default";
const SYNC_TIMEOUT_MS = 8000;

export interface BlockRange {
  from: number;
  to: number;
}

const isBlock = (node: PMNode) => node.type.isInGroup("block");

/**
 * The blocks to move: the drag-box selection, a selection across blocks,
 * the block the drag handle selected, or the block the cursor is in. Blocks
 * that can't stand alone in a page (a list item, a table row) move with
 * their parent.
 */
export function getBlocksToMove(editor: Editor): BlockRange | null {
  const { selection, doc } = editor.state;

  if (selection instanceof NodeRangeSelection) {
    return { from: selection.from, to: selection.to };
  }
  // A block the drag handle selected, wherever it sits (a column, say),
  // as long as it can stand alone in a page.
  if (selection instanceof NodeSelection && isBlock(selection.node)) {
    if (selection.node.type.name === "title") return null;
    return { from: selection.from, to: selection.to };
  }

  // A text selection, or a block that can't stand alone (a list item):
  // the top-level blocks it covers.
  const { $from, $to } = selection;
  if ($from.depth === 0) return null;
  const from = $from.before(1);
  const to = $to.depth === 0 ? $to.pos : $to.after(1);
  if (doc.nodeAt(from)?.type.name === "title") return null;
  return { from, to };
}

function waitFor(
  provider: HocuspocusProvider,
  done: () => boolean,
  event: "synced" | "unsyncedChanges",
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (done()) return resolve();
    const timer = window.setTimeout(() => {
      provider.off(event, check);
      reject(new Error("The other page didn't answer in time."));
    }, SYNC_TIMEOUT_MS);
    function check() {
      if (!done()) return;
      window.clearTimeout(timer);
      provider.off(event, check);
      resolve();
    }
    provider.on(event, check);
  });
}

/**
 * Appends `nodes` to the end of page `pageId` on the collaboration server.
 * Resolves once the server has the change.
 */
export async function appendToPage({
  pageId,
  token,
  schema,
  nodes,
}: {
  pageId: string;
  token: string;
  schema: Schema;
  nodes: PMNode[];
}): Promise<void> {
  const url = import.meta.env.VITE_HOCUSPOCUS_URL as string | undefined;
  if (!url) throw new Error("VITE_HOCUSPOCUS_URL is not configured");

  const ydoc = new Y.Doc();
  const provider = new HocuspocusProvider({
    url,
    name: `page:${pageId}`,
    document: ydoc,
    token,
  });

  try {
    await waitFor(provider, () => provider.isSynced, "synced");

    const fragment = ydoc.getXmlFragment(FIELD);
    const current = yXmlFragmentToProseMirrorRootNode(fragment, schema);

    // Drop a trailing empty line, so the blocks don't land after a gap.
    let content = current.content;
    const last = content.lastChild;
    if (
      last &&
      last.type.name === "paragraph" &&
      last.content.size === 0 &&
      content.childCount > 1
    ) {
      content = content.cut(0, content.size - last.nodeSize);
    }
    const next = current.copy(content.append(Fragment.from(nodes)));
    next.check(); // never write a document the schema rejects

    ydoc.transact(() => {
      updateYFragment(ydoc, fragment, next, {
        mapping: new Map(),
        isOMark: new Map(),
      });
    });

    // Wait until the server has acknowledged every change.
    await waitFor(
      provider,
      () => !provider.hasUnsyncedChanges,
      "unsyncedChanges",
    );
  } finally {
    provider.destroy();
    ydoc.destroy();
  }
}

/** Moves the blocks in `range` of `editor` to the end of page `pageId`. */
export async function moveBlocksToPage({
  editor,
  range,
  pageId,
  token,
}: {
  editor: Editor;
  range: BlockRange;
  pageId: string;
  token: string;
}): Promise<void> {
  const { doc } = editor.state;
  // Copy the blocks first: the page may change while the other one loads.
  const nodes: PMNode[] = [];
  doc.slice(range.from, range.to).content.forEach((node) => nodes.push(node));
  if (nodes.length === 0) return;
  const before = doc.slice(range.from, range.to);

  await appendToPage({ pageId, token, schema: editor.schema, nodes });

  // Remove them here — from where they are now, if the page changed while
  // the other page was loading.
  const now = editor.state.doc;
  let from = range.from;
  let to = range.to;
  if (!now.slice(from, to).eq(before)) {
    from = -1;
    now.descendants((node, pos) => {
      if (from !== -1) return false;
      if (node === nodes[0] || node.eq(nodes[0])) {
        const candidate = now.slice(pos, pos + before.size);
        if (candidate.eq(before)) {
          from = pos;
          to = pos + before.size;
        }
      }
      return true;
    });
    if (from === -1) return; // already gone (someone else removed them)
  }
  editor.chain().deleteRange({ from, to }).run();
}
