import type {
  AggregationFunction,
  CellValue,
  ConfigOf,
  DatabaseProperty,
  DataSource,
  ID,
  Page,
} from "../types";
import { linkedIds } from "./relation-ids";
import { propertyValue } from "./property-value";

// ── Value coercion helpers ─────────────────────────────────────────────────
function isEmpty(v: unknown): boolean {
  return (
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Dates come as ISO strings, { start, end } ranges (the start counts) or, for
// created / edited time, milliseconds.
function toTime(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v && typeof v === "object" && "start" in v) {
    return toTime((v as { start: unknown }).start);
  }
  if (typeof v !== "string" || !v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function valueToText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(valueToText).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as { label?: unknown; name?: unknown; start?: unknown };
    // SelectOption { label }, person { name }, date range { start }
    if (o.label != null) return String(o.label);
    if (o.name != null) return String(o.name);
    if (o.start != null) return String(o.start);
  }
  return "";
}

// ── Aggregation ─────────────────────────────────────────────────────────────
function aggregate(
  values: unknown[],
  agg: AggregationFunction,
): CellValue<"rollup"> {
  const total = values.length;
  const nonEmpty = values.filter((v) => !isEmpty(v));

  switch (agg) {
    case "count":
      return total;
    case "count_values":
    case "count_not_empty":
      return nonEmpty.length;
    case "count_empty":
      return total - nonEmpty.length;
    case "count_unique":
      return new Set(nonEmpty.map((v) => JSON.stringify(v))).size;
    case "percent_empty":
      return total ? round(((total - nonEmpty.length) / total) * 100) : 0;
    case "percent_not_empty":
      return total ? round((nonEmpty.length / total) * 100) : 0;

    case "sum":
    case "average":
    case "median":
    case "min":
    case "max":
    case "range": {
      const nums = values.map(toNumber).filter((n): n is number => n !== null);
      if (!nums.length) return null;
      switch (agg) {
        case "sum":
          return round(nums.reduce((a, b) => a + b, 0));
        case "average":
          return round(nums.reduce((a, b) => a + b, 0) / nums.length);
        case "median": {
          const s = [...nums].sort((a, b) => a - b);
          const m = Math.floor(s.length / 2);
          return s.length % 2 ? s[m] : round((s[m - 1] + s[m]) / 2);
        }
        case "min":
          return Math.min(...nums);
        case "max":
          return Math.max(...nums);
        case "range":
          return Math.max(...nums) - Math.min(...nums);
      }
      return null;
    }

    case "earliest_date":
    case "latest_date":
    case "date_range": {
      const dated = values
        .map((v) => ({ v, t: toTime(v) }))
        .filter((x): x is { v: unknown; t: number } => x.t !== null);
      if (!dated.length) return null;
      const times = dated.map((x) => x.t);
      if (agg === "date_range") {
        // whole days between earliest and latest
        return Math.round((Math.max(...times) - Math.min(...times)) / 86400000);
      }
      const pick =
        agg === "earliest_date"
          ? dated.reduce((a, b) => (b.t < a.t ? b : a))
          : dated.reduce((a, b) => (b.t > a.t ? b : a));
      // A date without a time stays "YYYY-MM-DD", so it shows as the same day
      // in every time zone (an ISO time at midnight UTC is the day before in
      // the Americas).
      const raw =
        pick.v && typeof pick.v === "object" && "start" in pick.v
          ? (pick.v as { start: unknown }).start
          : pick.v;
      if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw))
        return raw;
      return new Date(pick.t).toISOString();
    }

    case "checked":
      return values.filter((v) => v === true).length;
    case "unchecked":
      return values.filter((v) => v !== true).length;
    case "percent_checked":
      return total
        ? round((values.filter((v) => v === true).length / total) * 100)
        : 0;
    case "percent_unchecked":
      return total
        ? round((values.filter((v) => v !== true).length / total) * 100)
        : 0;

    case "show_original":
      return nonEmpty.map(valueToText).filter(Boolean).join(", ");

    default:
      return null;
  }
}

/**
 * Compute a rollup value for one record.
 *
 * Follows the record's relation (config.relationPropertyId) to its linked
 * target records — either side of a two-way relation — reads
 * config.targetPropertyId from each (title, created/edited fields, status
 * names and formulas included), and aggregates with config.aggregation.
 * Pure + read-only — recomputed on render like a formula.
 */
export function computeRollup(args: {
  /** the row; `id` is needed when the relation is the mirror side */
  record: { id?: ID; values: Record<ID, unknown> };
  /** the CURRENT database's schema (to resolve the relation property) */
  properties: DatabaseProperty[];
  /** the related database, loaded by the caller */
  targetSource: DataSource | undefined;
  config: ConfigOf<"rollup">;
  /** pages to resolve links against (at least the related database's rows) */
  pages: Page[];
}): CellValue<"rollup"> {
  const { record, properties, targetSource, config, pages } = args;
  if (!config.relationPropertyId) return null;

  const relationProp = properties.find(
    (p) => p.id === config.relationPropertyId,
  );
  if (!relationProp || relationProp.config.type !== "relation") return null;

  const ids = linkedIds(record, relationProp, pages);
  const linked = ids
    .map((id) => pages.find((p) => p.id === id))
    .filter((r): r is Page => !!r && r.deletedAt == null);

  // "Count all" = number of linked records. Before the related rows load,
  // fall back to the number of stored links.
  if (config.aggregation === "count")
    return pages.length ? linked.length : ids.length;

  if (!targetSource || !config.targetPropertyId) return null;
  const targetProp = targetSource.properties.find(
    (p) => p.id === config.targetPropertyId,
  );
  if (!targetProp) return null;

  const values = linked.map((r) =>
    propertyValue(r, targetProp, targetSource.properties),
  );
  return aggregate(values, config.aggregation);
}

/**
 * Returns a copy of `rows` with every rollup's value computed into
 * `values[rollupId]`, so filters, sorts, grouping and formulas can use it.
 * Derived like formula values: never saved.
 *
 * `sources` must hold the related databases (for the property each rollup
 * reads); `pages` must hold their rows.
 */
export function resolveRecordRollups<
  T extends { id: ID; values?: Record<ID, unknown> | null },
>(
  rows: T[],
  properties: DatabaseProperty[],
  sources: DataSource[],
  pages: Page[],
): T[] {
  const rollups = properties.filter((p) => p.config.type === "rollup");
  if (!rollups.length || !pages.length) return rows;

  const plans = rollups.map((prop) => {
    const config = prop.config as ConfigOf<"rollup">;
    const relation = properties.find((p) => p.id === config.relationPropertyId);
    const targetSourceId =
      relation?.config.type === "relation"
        ? relation.config.targetSourceId
        : null;
    return {
      prop,
      config,
      targetSource: targetSourceId
        ? sources.find((s) => s.id === targetSourceId)
        : undefined,
    };
  });

  return rows.map((row) => {
    const values: Record<ID, unknown> = { ...(row.values ?? {}) };
    for (const { prop, config, targetSource } of plans) {
      values[prop.id] = computeRollup({
        record: { id: row.id, values },
        properties,
        targetSource,
        config,
        pages,
      });
    }
    return { ...row, values } as T;
  });
}
