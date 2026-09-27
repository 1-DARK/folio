import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { commentThreadPluginKey } from "../comment-thread-extension";
import type { ID } from "src/types";
import { newId } from "src/lib/id";

// Start a local draft on the selection — a comment, or a suggested
// replacement for the selected text.
//
// From the block (drag handle) menu the selection is the whole node. For a
// text block (paragraph, heading…) the range is narrowed to the text inside
// it, so the highlight sits on the text and accepting a suggestion replaces
// the text without flattening the block. Suggestions need text to replace:
// they're ignored on non-text blocks (image, database…).
export function draftThread(
  editor: Editor,
  pageId: ID,
  kind: "comment" | "suggestion" = "comment",
) {
  const { selection } = editor.state;
  let { from, to } = selection;

  if (selection instanceof NodeSelection) {
    const node = selection.node;
    if (node.isTextblock) {
      from += 1;
      to -= 1;
    } else if (kind === "suggestion") {
      return;
    }
  }

  if (from >= to) return;

  const threadId = newId();

  editor.view.dispatch(
    editor.state.tr.setMeta(commentThreadPluginKey, {
      type: "draftThread",
      from,
      to,
      threadId,
      pageId,
      kind,
    }),
  );
}
