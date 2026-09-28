import type { CSSProperties } from "react";

// The Folio mark: three sheets stacked in 3D. Pure two-tone —
//   ink   (side faces, outlines) = currentColor
//   paper (top faces, right faces) = var(--folio-mark-paper), default white
// so it follows the surrounding text color and works on light and dark:
// on a dark surface set `color` light and `--folio-mark-paper` to the
// surface color.

const SLABS = [
  // Bottom to top (drawn back to front).
  {
    left: "20,70 60,93.08 60,102.08 20,79",
    right: "60,93.08 100,70 100,79 60,102.08",
    top: "60,46.92 100,70 60,93.08 20,70",
  },
  {
    left: "20,51 60,74.08 60,83.08 20,60",
    right: "60,74.08 100,51 100,60 60,83.08",
    top: "60,27.92 100,51 60,74.08 20,51",
  },
  {
    left: "20,32 60,55.08 60,64.08 20,41",
    right: "60,55.08 100,32 100,41 60,64.08",
    top: "60,8.92 100,32 60,55.08 20,32",
  },
];

export function FolioMark({
  size = 28,
  title = "Folio",
  style,
  className,
}: {
  size?: number;
  /** Accessible name; pass "" when the mark sits next to the word "Folio". */
  title?: string;
  style?: CSSProperties;
  className?: string;
}) {
  // Thicker outlines at icon sizes so the layers don't blur together.
  const stroke = size <= 20 ? 7 : size <= 40 ? 5.5 : 4;
  const paper = "var(--folio-mark-paper, #ffffff)";
  return (
    <svg
      viewBox="14 4 92 104"
      width={size}
      height={size}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {SLABS.map((s, i) => (
        <g key={i} stroke="currentColor" strokeWidth={stroke}>
          <polygon points={s.left} fill="currentColor" />
          <polygon points={s.right} fill={paper} />
          <polygon points={s.top} fill={paper} />
        </g>
      ))}
    </svg>
  );
}
