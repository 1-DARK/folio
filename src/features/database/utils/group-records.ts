import type { CellValue, DatabaseProperty, Page } from "src/types";
import { getColumnDefs } from "../nodes/database-board-node-view/utils/get-column-defs";
import {
  NO_GROUP_KEY,
  canWriteGroupValue,
  compareGroups,
  groupCellValue,
  groupKey,
  groupLabelFor,
  type GroupContext,
} from "./group-key";

export const NONE_KEY = NO_GROUP_KEY;
export const ALL_KEY = "__all__";

/** Inverse of groupKeyFor: the cell value that puts a record in a given
 *  group, or null when it can't be set (computed properties, "No …"). */
export function valueForGroupKey(
  key: string,
  prop: DatabaseProperty,
  ctx: GroupContext = {},
): CellValue | null {
  if (key === NONE_KEY || !canWriteGroupValue(prop)) return null;
  const cfg = prop.config;
  switch (cfg.type) {
    case "select":
      return cfg.options.find((o) => o.id === key) ?? null;
    case "multi_select": {
      const o = cfg.options.find((x) => x.id === key);
      return o ? [o] : [];
    }
    case "status":
      return key;
    case "checkbox":
      return key === "true";
    case "number": {
      const n = Number(key);
      return isNaN(n) ? null : n;
    }
    case "date":
      return key; // the group's day, "YYYY-MM-DD"
    case "person":
      return [{ id: key, name: ctx.personName?.(key) ?? "" }];
    case "relation":
      return [key] as unknown as CellValue; // relations store bare page ids
    case "text":
    case "url":
    case "email":
    case "phone":
      return key;
    default:
      return null;
  }
}

export function groupKeyFor(value: unknown, prop: DatabaseProperty): string {
  return groupKey(value, prop);
}

export function groupLabel(
  key: string,
  prop: DatabaseProperty,
  ctx: GroupContext = {},
): string {
  return groupLabelFor(key, prop, ctx);
}

export interface RecordGroup {
  key: string;
  label: string;
  records: Page[]; // whole pages — consumers need .id / .values
}

/**
 * Buckets ROWS (pages) by the given group property. No group property →
 * one bucket with every row (key = ALL_KEY).
 *
 * Order: "No …" first, then the property's options in their order (select,
 * status, checkbox), or for value groups dates / numbers ascending and text
 * A–Z. A row whose value is a list (multi-select, people, relation) sits in
 * the group of its first item.
 */
export function groupRecords(
  rows: Page[],
  groupProp: DatabaseProperty | undefined,
  ctx: GroupContext = {},
): RecordGroup[] {
  if (!groupProp) {
    return [{ key: ALL_KEY, label: "", records: rows }];
  }
  const map = new Map<string, Page[]>();
  for (const row of rows) {
    const key = groupKey(groupCellValue(row, groupProp), groupProp);
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }

  const groups = [...map.entries()].map(([key, records]) => ({
    key,
    label: groupLabelFor(key, groupProp, ctx),
    records,
  }));

  const optionOrder = new Map(
    getColumnDefs(groupProp).map((d, i) => [d.id, i] as const),
  );
  const byValue = compareGroups(groupProp);
  return groups.sort((a, b) => {
    if (a.key === NONE_KEY) return -1;
    if (b.key === NONE_KEY) return 1;
    if (optionOrder.size) {
      // Keys no longer among the options go last.
      return (
        (optionOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (optionOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER)
      );
    }
    return byValue(a, b);
  });
}
