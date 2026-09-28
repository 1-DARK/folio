import { useLayoutEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { ShowcaseViewer } from "./showcase-viewer";
import "./showcase-preview.scss";

// A showcase page shrunk into a frame, like a live screenshot: laid out at a
// desktop page width, then scaled to the frame's width and cropped to its
// aspect ratio (with a fade at the bottom). Not interactive.
export function ShowcasePreview({
  content,
  ratio,
  dark = false,
  pageWidth = 820,
  label,
  className,
}: {
  content: JSONContent;
  /** CSS aspect-ratio of the frame, e.g. "16 / 9". */
  ratio: string;
  /** Render with the app's dark tokens (the landing has its own theme). */
  dark?: boolean;
  /** Width the page is laid out at before scaling. */
  pageWidth?: number;
  /** Accessible description of the picture. */
  label: string;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / pageWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageWidth]);

  return (
    <div
      ref={frameRef}
      className={`showcase-preview${dark ? " dark" : ""}${className ? ` ${className}` : ""}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={label}
    >
      <div
        className="showcase-preview__page"
        inert
        style={{
          width: pageWidth,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <ShowcaseViewer content={content} />
      </div>
    </div>
  );
}
