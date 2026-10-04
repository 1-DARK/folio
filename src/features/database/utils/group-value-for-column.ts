import type { CellValue, DatabaseProperty } from "src/types";
import { valueForGroupKey } from "./group-records";
import type { GroupContext } from "./group-key";

/** The cell value to store so a record lands in the given column. Inverse of
 *  columnKeyFor. Null for "No …" and for columns that can't be written
 *  (computed properties, the derived side of a relation) — callers check
 *  canWriteGroupValue first. */
export function groupValueForColumn(
  prop: DatabaseProperty,
  columnKey: string,
  ctx: GroupContext = {},
): CellValue | null {
  return valueForGroupKey(columnKey, prop, ctx);
}
