import type { Editor } from "@tiptap/core";

// The + next to the drag handle: a new empty line below the hovered block
// (above it with Alt / Option), with the block menu ("/") open on it, like
// Notion. On an empty line it just opens the menu there.

export function insertBlockWithMenu(
  editor: Editor,
  pos: number,
  above = false,
) {
  const { state } = editor;
  const node = pos >= 0 ? state.doc.nodeAt(pos) : null;
  if (!node) return;
  const paragraph = state.schema.nodes.paragraph;

  // Already an empty line: open the menu right there.
  if (node.type === paragraph && node.content.size === 0) {
    editor
      .chain()
      .focus()
      .setTextSelection(pos + 1)
      .insertContent("/")
      .run();
    return;
  }

  // Where a paragraph may go: next to the hovered block, or next to the
  // nearest block around it that accepts one (a list item's list, say).
  let at = above ? pos : pos + node.nodeSize;
  let $at = state.doc.resolve(at);
  while (
    $at.depth > 0 &&
    !$at.parent.canReplaceWith($at.index(), $at.index(), paragraph)
  ) {
    at = above ? $at.before($at.depth) : $at.after($at.depth);
    $at = state.doc.resolve(at);
  }
  // Never above the page title.
  if (above && at === 0 && state.doc.firstChild?.type.name === "title") {
    at = state.doc.firstChild.nodeSize;
  }

  editor
    .chain()
    .focus()
    .insertContentAt(at, { type: "paragraph" })
    .setTextSelection(at + 1)
    .insertContent("/")
    .run();
}
