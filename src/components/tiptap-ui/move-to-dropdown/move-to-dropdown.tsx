import { useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useTranslation } from "react-i18next";
import { ChevronRight, CornerUpRight, Search } from "lucide-react";
import { Button } from "src/components/tiptap-ui-primitive/button";
import { Card } from "src/components/tiptap-ui-primitive/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/tiptap-ui-primitive/dropdown-menu";
import { PageItemIcon } from "src/features/pages/page-item/page-item-icon";
import { usePages } from "src/hooks/use-pages";
import { useSession } from "src/hooks/use-session";
import { useOptionalActivePage } from "src/features/pages/context/active-page-context";
import { useToast } from "src/features/shell/toast";
import {
  getBlocksToMove,
  moveBlocksToPage,
} from "src/features/editor/move-blocks/move-blocks";
import type { Page } from "src/types";
import "./move-to-dropdown.scss";

const MAX_RESULTS = 40;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * "Move to" in the block menu: pick a page, the selected blocks go to the
 * end of it. Only in signed-in pages (it needs the page list and a session).
 */
export function MoveToDropdown({
  editor,
  onAction,
}: {
  editor: Editor;
  onAction?: () => void;
}) {
  const { t } = useTranslation();
  // Rendered only inside the app (the block menu checks for a page).
  const { activePageId, setActivePageId } = useOptionalActivePage();
  const { session } = useSession();
  const { data: pages = [] } = usePages();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return (pages as Page[])
      .filter(
        (p) => p.deletedAt == null && String(p.id) !== String(activePageId),
      )
      .filter((p) => !q || normalize(p.title || "").includes(q))
      .sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0))
      .slice(0, MAX_RESULTS);
  }, [pages, query, activePageId]);

  const token = session?.access_token;
  if (!activePageId || !token) return null;

  const move = (page: Page) => {
    const range = getBlocksToMove(editor);
    setOpen(false);
    onAction?.();
    if (!range) return;
    const title = page.title || t("page.newPage");
    moveBlocksToPage({ editor, range, pageId: String(page.id), token })
      .then(() =>
        toast.show(t("moveTo.done", { title }), "success", {
          label: t("moveTo.open"),
          onClick: () => setActivePageId(page.id),
        }),
      )
      .catch((error: unknown) => {
        console.error("Move to page failed:", error);
        toast.show(t("moveTo.failed", { title }), "error");
      });
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setActive(0);
          // The menu focuses itself when it opens; take the focus back for
          // the search box once it has.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => inputRef.current?.focus()),
          );
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="menu-button"
          style={{ justifyContent: "flex-start", width: "100%" }}
        >
          <CornerUpRight className="tiptap-button-icon" />
          <span className="tiptap-button-text">{t("moveTo.label")}</span>
          <ChevronRight className="tiptap-button-icon chevron" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="move-to-content"
      >
        <Card className="move-to-card">
          <label className="move-to-search">
            <Search size={14} />
            <input
              ref={inputRef}
              value={query}
              placeholder={t("moveTo.search")}
              aria-label={t("moveTo.search")}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                // Keep the menu's own letter navigation out of the search.
                e.stopPropagation();
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(results.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (results[active]) move(results[active]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
          </label>
          <div className="move-to-list" ref={listRef} role="listbox">
            {results.length === 0 && (
              <div className="move-to-empty">{t("moveTo.none")}</div>
            )}
            {results.map((page, i) => (
              <DropdownMenuItem key={page.id} asChild>
                <Button
                  type="button"
                  variant="ghost"
                  role="option"
                  aria-selected={i === active}
                  data-highlighted={i === active}
                  className="move-to-item"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => move(page)}
                >
                  <PageItemIcon cover={page.cover} styles={{ fontSize: 14 }} />
                  <span className="tiptap-button-text">
                    {page.title || t("page.newPage")}
                  </span>
                </Button>
              </DropdownMenuItem>
            ))}
          </div>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
