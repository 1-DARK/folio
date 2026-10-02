import { useEffect, useRef } from "react";
import { Card } from "src/components/tiptap-ui-primitive/card";
import { useTocActions, useTocContent, useTocUIState } from "./toc-context";

interface Props {
  maxShowCount?: number;
  topOffset?: number;
  className?: string;
}

export function TocContent({ maxShowCount = 20, topOffset = 0 }: Props) {
  const { activeId, open } = useTocUIState();
  const { hideTocContent, navigateToHeading, normalizeDepths } =
    useTocActions();
  const { tocContent } = useTocContent();
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const items = tocContent.slice(0, maxShowCount);
  const depths = normalizeDepths(items);

  // The provider tracks the heading you're reading (on scroll, and pinned
  // to a clicked heading while it scrolls there).
  const resolvedActive = activeId ?? items[0]?.id ?? null;

  // Keep the highlighted entry visible in a long list.
  useEffect(() => {
    if (!open || !resolvedActive) return;
    itemRefs.current[resolvedActive]?.scrollIntoView({ block: "nearest" });
  }, [open, resolvedActive]);

  if (!items.length) return null;

  return (
    <Card
      className="toc-sidebar__card"
      style={{
        pointerEvents: `${open ? "auto" : "none"}`,
        visibility: `${open ? "visible" : "hidden"}`,
        transform: `${open ? "translateX(-4px)" : "translateX(0)"}`,
      }}
      onMouseLeave={() => hideTocContent()}
    >
      <div className="toc-sidebar__wrapper">
        <nav className="toc-sidebar__nav">
          {items.map((item, i) => (
            <a
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              href={`#${item.id}`}
              className={`toc-sidebar__item ${resolvedActive === item.id ? "toc-sidebar__item--active" : ""}`}
              style={{ paddingLeft: `${(depths[i] - 1) * 12}px` }}
              onClick={(e) => {
                e.preventDefault();
                navigateToHeading(item, topOffset);
              }}
            >
              {item.textContent}
            </a>
          ))}
        </nav>
      </div>
    </Card>
  );
}
