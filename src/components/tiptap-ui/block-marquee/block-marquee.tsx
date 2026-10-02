import { useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
// Installed with @tiptap/extension-drag-handle (its peer dependency).
import { NodeRangeSelection } from "@tiptap/extension-node-range";
import "./block-marquee.scss";

// Drag-box selection, like Notion: press in the empty space around the
// text (the page margin, the gap between blocks) and drag a box; every
// block it touches is selected. The selection is a whole-block selection
// (see BlockSelection), so Delete, copy / cut, typing and dragging a handle
// all act on those blocks.
//
// Everything runs on DOM listeners added here and plain variables: nothing
// re-renders while the box is drawn. The editor is only told the new
// selection when the set of touched blocks changes.

/** Where a drag may start (the editor's page area). */
const SURFACES = ".landing-page-surface, .simple-editor-center";

/** Things in that area that keep their own mouse behaviour. */
const EXCLUDE = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "[role='button']",
  "[contenteditable='false']",
  ".drag-handle",
  ".column-drag-handle",
  ".block-comment-handle",
  ".tiptap-toolbar",
  ".cover-header-wrapper",
  ".landing-page-head",
  "[data-radix-popper-content-wrapper]",
  "[data-no-marquee]",
].join(",");

/** Pixels the pointer must move before a press becomes a drag-box. */
const THRESHOLD = 5;
/** Distance from the edge of the scroll area where auto-scroll starts. */
const EDGE = 48;

function scrollParentOf(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (
      /(auto|scroll|overlay)/.test(overflowY) &&
      p.scrollHeight > p.clientHeight
    ) {
      return p;
    }
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

export function BlockMarquee({ editor }: { editor: Editor | null }) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const view = editor.view;

    let pressing = false;
    let active = false;
    let onEditorPadding = false;
    let startX = 0;
    let startY = 0; // in scroll-content coordinates
    let pointerX = 0;
    let pointerY = 0;
    let scroller: HTMLElement = document.documentElement;
    let box: HTMLDivElement | null = null;
    let frame = 0;
    let lastRange = "";

    const scrollTop = () =>
      scroller === document.scrollingElement
        ? window.scrollY
        : scroller.scrollTop;

    const select = (rect: DOMRect) => {
      const { doc } = view.state;
      const editorBox = view.dom.getBoundingClientRect();
      let from = -1;
      let to = -1;
      doc.forEach((node, offset) => {
        if (node.type.name === "title") return;
        const dom = view.nodeDOM(offset);
        if (!(dom instanceof HTMLElement)) return;
        const r = dom.getBoundingClientRect();
        // A block counts across the editor's full width, so a box drawn in
        // the margin next to it selects it.
        const left = Math.min(r.left, editorBox.left);
        const right = Math.max(r.right, editorBox.right);
        const touches =
          rect.top < r.bottom &&
          rect.bottom > r.top &&
          rect.left < right &&
          rect.right > left;
        if (!touches) return;
        if (from === -1) from = offset;
        to = offset + node.nodeSize;
      });
      const key = `${from}:${to}`;
      if (key === lastRange) return;
      lastRange = key;
      if (from === -1) {
        // Nothing touched (yet): no block selected.
        const $start = doc.resolve(view.state.selection.from);
        view.dispatch(view.state.tr.setSelection(TextSelection.near($start)));
        return;
      }
      view.dispatch(
        view.state.tr.setSelection(NodeRangeSelection.create(doc, from, to, 0)),
      );
    };

    const draw = () => {
      frame = 0;
      if (!active || !box) return;

      // Auto-scroll near the top / bottom of the scroll area.
      const area =
        scroller === document.scrollingElement
          ? { top: 0, bottom: window.innerHeight }
          : scroller.getBoundingClientRect();
      let dy = 0;
      if (pointerY < area.top + EDGE)
        dy = -Math.ceil((area.top + EDGE - pointerY) / 4);
      else if (pointerY > area.bottom - EDGE)
        dy = Math.ceil((pointerY - (area.bottom - EDGE)) / 4);
      if (dy) {
        if (scroller === document.scrollingElement) window.scrollBy(0, dy);
        else scroller.scrollTop += dy;
      }

      const top = startY - scrollTop();
      const rect = new DOMRect(
        Math.min(startX, pointerX),
        Math.min(top, pointerY),
        Math.abs(pointerX - startX),
        Math.abs(pointerY - top),
      );
      Object.assign(box.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      select(rect);

      // Keep scrolling while the pointer rests at an edge.
      if (dy) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      if (!pressing) return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!active) {
        const top = startY - scrollTop();
        if (Math.hypot(pointerX - startX, pointerY - top) < THRESHOLD) return;
        active = true;
        lastRange = "";
        box = document.createElement("div");
        box.className = "block-marquee";
        document.body.appendChild(box);
        document.body.classList.add("is-marquee-selecting");
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const finish = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      box?.remove();
      box = null;
      document.body.classList.remove("is-marquee-selecting");
      pressing = false;
    };

    const onUp = (e: MouseEvent) => {
      const wasActive = active;
      active = false;
      finish();
      if (editor.isDestroyed) return;
      if (wasActive) {
        // Keys (Delete, Ctrl+C…) go to the editor from here.
        view.focus();
        return;
      }
      // A plain click on the editor's own padding: place the cursor there,
      // as the browser would have.
      if (onEditorPadding) {
        const hit = view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (hit) {
          const $pos = view.state.doc.resolve(hit.pos);
          view.dispatch(view.state.tr.setSelection(TextSelection.near($pos)));
        }
        view.focus();
      }
    };

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!editor.isEditable || editor.isDestroyed) return;
      const target = e.target as Element | null;
      if (!target) return;
      const surface = view.dom.closest(SURFACES) ?? view.dom.parentElement;
      if (!surface?.contains(target)) return;
      if (target.closest(EXCLUDE)) return;
      onEditorPadding = target === view.dom;
      // Inside the text: normal editing.
      if (view.dom.contains(target) && !onEditorPadding) return;

      // Stop the browser from starting a text selection.
      e.preventDefault();
      scroller = scrollParentOf(view.dom);
      pressing = true;
      active = false;
      startX = e.clientX;
      startY = e.clientY + scrollTop();
      pointerX = e.clientX;
      pointerY = e.clientY;
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };

    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      finish();
    };
  }, [editor]);

  return null;
}
