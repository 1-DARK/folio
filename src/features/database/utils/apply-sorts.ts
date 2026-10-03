import type { Page, DatabaseProperty, SortRule } from "src/types";
import { getCellValue } from "./apply-filters";

function compareValues(
  a: unknown,
  b: unknown,
  direction: "asc" | "desc",
): number {
  const mult = direction === "asc" ? 1 : -1;

  if (a == null && b == null) return 0;
  if (a == null) return mult;
  if (b == null) return -mult;

  if (typeof a === "boolean" && typeof b === "boolean") {
    return mult * (Number(a) - Number(b));
  }

  if (typeof a === "number" && typeof b === "number") {
    return mult * (a - b);
  }

  // Lists (people, multi-select, created by…): compare their names or ids.
  if (Array.isArray(a) || Array.isArray(b)) {
    const text = (v: unknown) =>
      (Array.isArray(v) ? v : [v])
        .map((x) =>
          x && typeof x === "object"
            ? String(
                (x as { name?: unknown; label?: unknown; id?: unknown }).name ??
                  (x as { label?: unknown }).label ??
                  (x as { id?: unknown }).id ??
                  "",
              )
            : String(x ?? ""),
        )
        .join(", ");
    const ta = text(a);
    const tb = text(b);
    if (!ta && !tb) return 0;
    if (!ta) return mult;
    if (!tb) return -mult;
    return mult * ta.localeCompare(tb);
  }

  // Date strings
  const da = new Date(String(a));
  const db = new Date(String(b));
  if (!isNaN(da.getTime()) && !isNaN(db.getTime())) {
    return mult * (da.getTime() - db.getTime());
  }

  return mult * String(a).localeCompare(String(b));
}

/**
 * Returns a NEW sorted array (does not mutate). Records ARE Pages — the old
 * DataSourceRecord type was a leftover from when records lived inside the
 * DataSource.
 */
export function sortRecords(
  records: Page[],
  sorts: SortRule[],
  properties?: DatabaseProperty[],
): Page[] {
  if (!sorts || sorts.length === 0) return records;
  return [...records].sort((a, b) => {
    for (const sort of sorts) {
      const av = getCellValue(a, sort.propertyId, properties);
      const bv = getCellValue(b, sort.propertyId, properties);
      const cmp = compareValues(av, bv, sort.direction);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}
