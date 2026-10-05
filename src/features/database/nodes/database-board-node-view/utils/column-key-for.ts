import type { DatabaseProperty } from "src/types";
import { NO_GROUP_KEY, groupKey } from "../../../utils/group-key";

export const NONE_COLUMN_ID = NO_GROUP_KEY;

/** The board column a value falls in. Same keys as the table / list groups
 *  (see utils/group-key.ts): option ids, "true"/"false", local days for
 *  dates, the first item of a list (multi-select, people, relation). */
export function columnKeyFor(value: unknown, prop: DatabaseProperty): string {
  return groupKey(value, prop);
}
