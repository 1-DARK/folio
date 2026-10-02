import {
  NodeViewWrapper,
  NodeViewContent,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useState } from "react";
import "./column-view.scss";

const MIN_PERCENT = 10;
const round1 = (n: number) => Math.round(n * 10) / 10;

// Drag the border between two columns: the column on the left and its
// neighbour on the right trade width, in percentages, so the row always adds
// up to 100% and looks the same on any screen. The widths are applied to the
// node view's outer element (see column.ts, `attrs`), which is the real flex
// item in the row.
function useColumnResize(props: ReactNodeViewProps) {
  const [resizing, setResizing] = useState(false);

  const start = (event: React.PointerEvent) => {
    const { editor } = props;
    const pos = props.getPos?.();
    if (typeof pos !== "number") return;
    const view = editor.view;
    const $pos = view.state.doc.resolve(pos);
    const block = $pos.parent;
    if (block.type.name !== "columnBlock") return;
    const index = $pos.index();
    if (index >= block.childCount - 1) return; // the last column has no border to drag

    event.preventDefault();
    event.stopPropagation();

    // Current widths, measured, as percentages of the row.
    const blockStart = $pos.start();
    const px: number[] = [];
    const original: string[] = [];
    block.forEach((child, offset) => {
      original.push(child.attrs.width);
      const dom = view.nodeDOM(blockStart + offset) as HTMLElement | null;
      px.push(dom?.getBoundingClientRect().width ?? 0);
    });
    const total = px.reduce((a, b) => a + b, 0);
    if (!total) return;
    const startPct = px.map((w) => (w / total) * 100);
    const pair = startPct[index] + startPct[index + 1];
    const startX = event.clientX;

    let frame = 0;
    let latest = startPct;

    const write = (
      pct: number[] | null,
      addToHistory: boolean,
      exact?: string[],
    ) => {
      const current = props.getPos?.();
      if (typeof current !== "number") return;
      const state = view.state;
      const $c = state.doc.resolve(current);
      const parent = $c.parent;
      if (parent.type.name !== "columnBlock") return;
      const tr = state.tr;
      const base = $c.start();
      parent.forEach((child, offset, i) => {
        const width =
          exact?.[i] ?? `${round1(pct?.[i] ?? 100 / parent.childCount)}%`;
        if (child.attrs.width !== width) {
          tr.setNodeMarkup(base + offset, undefined, { ...child.attrs, width });
        }
      });
      if (!tr.docChanged) return;
      if (!addToHistory) tr.setMeta("addToHistory", false);
      view.dispatch(tr);
    };

    const onMove = (e: PointerEvent) => {
      const dx = ((e.clientX - startX) / total) * 100;
      const left = Math.min(
        Math.max(startPct[index] + dx, MIN_PERCENT),
        pair - MIN_PERCENT,
      );
      latest = startPct.map((p, i) =>
        i === index ? left : i === index + 1 ? pair - left : p,
      );
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => write(latest, false));
    };

    const onUp = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // One undo step for the whole drag.
      write(null, false, original);
      write(latest, true);
      setResizing(false);
      document.dispatchEvent(
        new CustomEvent("column:resize", { detail: { isResizing: false } }),
      );
    };

    setResizing(true);
    document.dispatchEvent(
      new CustomEvent("column:resize", { detail: { isResizing: true } }),
    );
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return { resizing, start };
}

export default function ColumnView(props: ReactNodeViewProps) {
  const { resizing, start } = useColumnResize(props);

  return (
    <NodeViewWrapper
      as="div"
      data-type="column"
      data-resizing={resizing ? "true" : undefined}
      style={{ position: "relative", width: "100%", minWidth: 0 }}
    >
      {/* Left drop zone */}
      <div
        className="column-drop-zone column-drop-zone--left"
        data-drop-zone="left"
        data-node-view-ignore
        contentEditable={false}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "20%",
          height: "100%",
          zIndex: 10,
        }}
      />

      {/* Right drop zone */}
      <div
        className="column-drop-zone column-drop-zone--right"
        data-drop-zone="right"
        data-node-view-ignore
        contentEditable={false}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "20%",
          height: "100%",
          zIndex: 10,
        }}
      />

      <NodeViewContent
        as="div"
        style={{
          width: "100%",
          minHeight: "5rem",
          display: "block",
        }}
        draggable={true}
      />
      {props.editor.isEditable && (
        <span
          className="column-resizer"
          contentEditable={false}
          aria-hidden
          onPointerDown={start}
        />
      )}
    </NodeViewWrapper>
  );
}
