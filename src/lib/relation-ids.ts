import type { DatabaseProperty, ID, Page, RelationValue } from "../types";

// Relation links, read the same way everywhere (cells, rollups, formulas).

/** Linked page ids from a stored relation value. Accepts both shapes in use:
 *  bare ids (string[]) and RelationValue objects ({ pageId } — older data may
 *  still say recordId). */
export function relationRecordIds(raw: unknown): ID[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const o = item as Partial<RelationValue> & { recordId?: unknown };
        if (o.pageId != null) return String(o.pageId);
        if (o.recordId != null) return String(o.recordId);
      }
      return null;
    })
    .filter((x): x is string => !!x);
}

/** Whether a relation property is the derived side of a two-way relation:
 *  it stores nothing, its links are the rows on the other side that point at
 *  this row. */
export function isMirrorRelation(prop: DatabaseProperty | undefined): boolean {
  return (
    prop?.config.type === "relation" &&
    !!prop.config.mirrorPropertyId &&
    !prop.config.showOnTarget
  );
}

/**
 * The page ids a row links to through a relation property. The stored side
 * reads its own value; the mirror side scans the other database's rows
 * (from `pages`) for links back to this row.
 */
export function linkedIds(
  record: { id?: ID; values?: Record<ID, unknown> | null },
  prop: DatabaseProperty,
  pages: Page[],
): ID[] {
  if (prop.config.type !== "relation") return [];
  if (isMirrorRelation(prop)) {
    const originPropId = prop.config.mirrorPropertyId as ID;
    const targetSourceId = prop.config.targetSourceId;
    if (!record.id) return [];
    return pages
      .filter(
        (p) =>
          p.sourceId === targetSourceId &&
          p.deletedAt == null &&
          relationRecordIds(p.values?.[originPropId]).includes(record.id!),
      )
      .map((p) => p.id);
  }
  return relationRecordIds(record.values?.[prop.id]);
}
