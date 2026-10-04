import { useMemo } from "react";
import type { DataSource, Page, ListView } from "src/types";
import type { UseDatabaseReturn } from "./use-database";
import { buildGroupedRows } from "../utils/group-rows";
import { groupRecords } from "../utils/group-records";
import { usePageTitles } from "./use-page-titles";
import { useWorkspacePeople } from "./use-workspace-people";

// (grouping + row slots/headers) for the LIST view — no per-group column strip.
export function useListLayout(
  sortedRecords: Page[],
  source: DataSource | null,
  db: UseDatabaseReturn,
) {
  const activeView = db.activeView;

  const groupByPropertyId =
    activeView?.type === "list"
      ? ((activeView as ListView).groupByPropertyId ?? null)
      : null;

  const groupProp = groupByPropertyId
    ? source?.properties.find((p) => p.id === groupByPropertyId)
    : undefined;

  // Readable group names for relations and people.
  const titleOf = usePageTitles();
  const people = useWorkspacePeople();
  const personName = useMemo(() => {
    const names = new Map(people.map((p) => [p.id, p.name] as const));
    return (id: string) => names.get(id);
  }, [people]);

  const collapsedKeys = useMemo(
    () => new Set((activeView as ListView)?.collapsedGroups ?? []),
    [activeView],
  );

  const listLayout = useMemo(() => {
    if (!groupProp) {
      return { rowSlots: sortedRecords.map((r) => r.id), headers: [] };
    }
    return buildGroupedRows<"list">(
      "list",
      groupRecords(sortedRecords, groupProp, { titleOf, personName }),
      collapsedKeys,
      (activeView as ListView)?.showEmptyGroups ?? false,
    );
  }, [
    sortedRecords,
    groupProp,
    collapsedKeys,
    activeView,
    titleOf,
    personName,
  ]);

  return { listLayout, groupProp };
}
