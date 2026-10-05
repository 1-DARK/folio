import { useCallback } from "react";
import type { ID, Page } from "src/types";
import { usePagesBase } from "src/hooks/use-pages";

const selectTitles = (pages: Page[]) =>
  new Map(pages.map((p) => [p.id, p.title ?? ""] as const));

/**
 * Page id → title, for filters and sorts on relations (a relation stores
 * page ids; people filter and sort by the linked pages' names).
 */
export function usePageTitles(): (id: ID) => string | undefined {
  const { data: titles } = usePagesBase(selectTitles);
  return useCallback((id: ID) => titles?.get(id), [titles]);
}
