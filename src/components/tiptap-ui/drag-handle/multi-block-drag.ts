import type { Editor } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
// Installed with @tiptap/extension-drag-handle (its peer dependency).
import { NodeRangeSelection } from "@tiptap/extension-node-range";

// Drag several blocks at once.
//
// Select across blocks (or Shift+click grips to extend the selection), then
// drag any grip inside the selection: every selected block moves together.
//
// The drag handle library already tries this, but compares positions by
// object identity and, with nested drag on, only ever drags the hovered
// node. So the handle keeps the selection on pointer down, and right after
// the library's own dragstart work, startMultiBlockDrag replaces what is
// being dragged with the whole range.

export interface BlockRange {
  from: number;
  to: number;
  depth: number;
}

/** The whole blocks a selection spans, when it spans two or more. */
export function selectedBlockRange(editor: Editor): BlockRange | null {
  const sel = editor.state.selection;
  if (sel.empty || sel instanceof NodeSelection) return null;

  if (sel instanceof NodeRangeSelection) {
    return sel.ranges.length > 1
      ? { from: sel.from, to: sel.to, depth: sel.$from.depth }
      : null;
  }

  // Text selections only (a table cell selection is its own thing).
  if (!(sel instanceof TextSelection)) return null;
  const range = sel.$from.blockRange(sel.$to);
  if (!range || range.endIndex - range.startIndex < 2) return null;
  return { from: range.start, to: range.end, depth: range.depth };
}

/** Whether the block at `pos` is part of the range. */
export function rangeContains(range: BlockRange, pos: number): boolean {
  return pos >= range.from && pos < range.to;
}

/**
 * Shift+click on a grip: extend the selection from where it starts to the
 * whole block at `pos` (above or below).
 */
export function extendSelectionToBlock(editor: Editor, pos: number) {
  const { state } = editor;
  const node = state.doc.nodeAt(pos);
  if (!node) return;
  const anchor = state.selection.anchor;
  const blockStart = pos;
  const blockEnd = pos + node.nodeSize;
  const head = blockEnd <= anchor ? blockStart : blockEnd;
  const selection = TextSelection.between(
    state.doc.resolve(anchor),
    state.doc.resolve(head),
  );
  editor.view.dispatch(state.tr.setSelection(selection));
  editor.view.focus();
}

/** Called during dragstart, after the drag handle library's own handler. */
export function startMultiBlockDrag(
  editor: Editor,
  event: DragEvent,
  range: BlockRange,
) {
  const { view } = editor;
  const { doc } = view.state;
  if (!event.dataTransfer) return;

  const selection = NodeRangeSelection.create(
    doc,
    range.from,
    range.to,
    range.depth,
  );
  const slice = selection.content();

  // Drag image: a copy of every block, stacked.
  const ghost = document.createElement("div");
  ghost.className = "multi-block-drag-ghost";
  for (const r of selection.ranges) {
    const el = view.nodeDOM(r.$from.pos);
    if (el instanceof HTMLElement) ghost.append(el.cloneNode(true));
  }
  Object.assign(ghost.style, {
    position: "absolute",
    top: "-10000px",
    left: "0",
    width: `${view.dom.clientWidth}px`,
    pointerEvents: "none",
  });
  document.body.append(ghost);
  event.dataTransfer.setDragImage(ghost, 0, 0);
  const cleanup = () => ghost.remove();
  document.addEventListener("drop", cleanup, { once: true });
  document.addEventListener("dragend", cleanup, { once: true });

  view.dragging = { slice, move: true };
  view.dispatch(view.state.tr.setSelection(selection));
}
