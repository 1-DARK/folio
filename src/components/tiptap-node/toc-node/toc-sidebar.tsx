import { TocProgress } from "./toc-progress-bar";
import { TocContent } from "./toc-content";
import { useEditorRefs } from "src/features/editor/context/editor-refs-context";
import { useEffect } from "react";
import { useTocActions } from "./toc-context";
import { useIsMobile } from "src/hooks/use-breakpoint";

interface Props {
  maxShowCount?: number;
  topOffset?: number;
  className?: string;
}

function TocSidebarImpl({
  maxShowCount = 20,
  topOffset = 0,
  className = "",
}: Props) {
  const refsRef = useEditorRefs();

  const { setTocContent } = useTocActions();

  useEffect(() => {
    refsRef.current.setTocContent = setTocContent;
  }, [setTocContent, refsRef]);

  const isMobile = useIsMobile();
  if (isMobile) return null;

  return (
    <aside className={`toc-sidebar ${className}`}>
      <TocProgress maxShowCount={maxShowCount} />
      <TocContent maxShowCount={maxShowCount} topOffset={topOffset} />
    </aside>
  );
}

export const TocSidebar = TocSidebarImpl;
