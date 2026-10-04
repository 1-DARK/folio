import type { DatabaseProperty, ID, Page } from "../types";
import { evaluateFormula } from "../features/database/components/formula-editor/formula-evaluator";

// A row's value for a property, wherever it actually lives. Most values sit
// in page.values, but some live on the page itself (title, created/edited
// time and person), a status is stored as an item id, and a formula has to be
// computed. Rollups (and anything else reading another row) go through here
// so they see what the cell shows.

/** Status item id (or legacy name) → its display name. */
export function statusName(
  prop: DatabaseProperty,
  raw: unknown,
): string | null {
  if (prop.config.type !== "status" || raw == null || raw === "") return null;
  for (const g of prop.config.groups) {
    for (const item of g.items) {
      if (item.id === raw || item.name === raw) return item.name;
    }
  }
  return null;
}

export function propertyValue(
  page: Page,
  prop: DatabaseProperty,
  /** the page's own database schema — needed for formulas */
  properties: DatabaseProperty[],
): unknown {
  const values = page.values ?? {};
  switch (prop.config.type) {
    case "title":
      return page.title ?? "";
    case "created_time":
      return page.createdAt ?? null;
    case "edited_time":
      return page.updatedAt ?? page.createdAt ?? null;
    case "created_by":
      return page.ownerId ?? null;
    case "edited_by":
      return (
        (page as Page & { editedBy?: ID | null }).editedBy ??
        page.ownerId ??
        null
      );
    case "status":
      return statusName(prop, values[prop.id]);
    case "formula":
      return evaluateFormula(prop.config.expression, {
        properties,
        cellValues: values as Record<ID, never>,
        page,
      });
    default:
      return values[prop.id] ?? null;
  }
}
