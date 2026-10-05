import { DynamicIcon } from "src/features/pages/cover/dynamic-icon";
import type { Page } from "src/types";
import type { CSSProperties } from "react";
import { FileText, TbFileText } from "src/components/tiptap-icons";
import { SB_ICON } from "src/features/shell/sidebar/sidebar-icon";

interface PageItemIconProps {
  cover: Page["cover"];
  styles?: CSSProperties;
  usePrimaryColor?: boolean;
  /** Sidebar rows: pages without an icon get the sidebar's Tabler file
   *  glyph (same size and stroke as the nav icons) instead of FileText. */
  variant?: "default" | "sidebar";
}

export function PageItemIcon({
  cover,
  styles,
  variant = "default",
}: PageItemIconProps) {
  const hasIcon = Boolean(cover.iconName);

  if (variant === "sidebar" && !hasIcon) {
    const tint =
      cover.target === "Icons" &&
      cover.color &&
      cover.color !== "var(--tt-text-color)"
        ? cover.color
        : undefined;
    return (
      <span className="page-icon" style={{ ...styles }} aria-hidden="true">
        <TbFileText {...SB_ICON} style={tint ? { color: tint } : undefined} />
      </span>
    );
  }

  if (cover.target === "Emoji" && hasIcon) {
    return (
      <span
        className="page-icon emoji"
        style={{ ...styles, fontSize: 16.5 }}
        aria-hidden="true"
      >
        {cover.iconName}
      </span>
    );
  }

  if (cover.target === "Icons") {
    return (
      <span className="page-icon" style={{ ...styles }} aria-hidden="true">
        {hasIcon ? (
          <DynamicIcon
            style={{
              color:
                !cover.color || cover.color === "var(--tt-text-color)"
                  ? "var(--tt-text-primary)"
                  : cover.color,
            }}
            name={cover.iconName!}
            size={37}
          />
        ) : (
          <FileText
            size={38}
            style={{
              width: 38,
              height: 38,
              color:
                !cover.color || cover.color === "var(--tt-text-color)"
                  ? "var(--tt-text-color)"
                  : cover.color,
            }}
          />
          // <DynamicIcon
          //   name="description"
          //   size={21}
          //   weight={400}
          //   filled={false}
          //   style={{
          //     color:
          //       !cover.color || cover.color === "var(--tt-text-color)"
          //         ? "var(--tt-text-color)"
          //         : cover.color,
          //   }}
          // />
        )}
      </span>
    );
  }

  return (
    <span className="page-icon" /*style={{ ...styles }}*/ aria-hidden="true">
      <FileText size={38} style={{ width: 38, height: 38 }} />
    </span>
  );
}
