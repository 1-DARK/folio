import { useDataSource } from "../../../hooks/use-data-source";
import type {
  AggregationFunction,
  ConfigOf,
  DatabaseProperty,
  Page,
} from "src/types";
import { computeRollup } from "src/lib/compute-rollup";
import { useRows } from "src/hooks/use-pages";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

function formatRollup(
  value: string | number | null,
  agg: AggregationFunction,
  t: TFunction,
  locale: string,
): string {
  if (value === null || value === "") return "";
  if (agg === "earliest_date" || agg === "latest_date") {
    const s = String(value);
    // "YYYY-MM-DD" is a calendar day: build it in local time, not UTC.
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const d = day
      ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
      : new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString(locale);
  }
  if (agg === "date_range")
    return t("database.rollup.days", { count: Number(value) });
  if (agg.startsWith("percent_")) return `${value}%`;
  if (typeof value === "number") return value.toLocaleString(locale);
  return String(value);
}

/**
 * Rollup cell — computed + read-only. Resolves the relation's target database,
 * loads it, and renders the aggregated value. Special-cased in the dispatcher
 * (gets `record` + `properties`) because a rollup needs the record's relation
 * value and the schema, which CellProps alone doesn't carry.
 */
export function RollupCell({
  config,
  record,
  properties,
  className,
}: {
  config: ConfigOf<"rollup">;
  record: Page;
  properties: DatabaseProperty[];
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const relationProp = properties.find(
    (p) => p.id === config.relationPropertyId,
  );
  const targetSourceId =
    relationProp?.config.type === "relation"
      ? relationProp.config.targetSourceId
      : null;

  const { source: targetSource } = useDataSource(targetSourceId || null);

  // The linked ids point at TARGET-database rows, and computeRollup reads each
  // linked row's values[targetPropertyId]. usePages() didn't supply those rows
  // with values, so every aggregation except `count` (which only needs
  // ids.length) came back empty. Load the target source's rows explicitly —
  // the same set the relation cell resolves against.
  const { data: targetRows } = useRows(targetSourceId || "");

  const value = computeRollup({
    record: { id: record.id, values: record.values ?? {} },
    properties,
    targetSource,
    config,
    pages: targetRows ?? [],
  });

  return (
    <div className={className} data-wrap="false">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: 34,
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--tt-text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {formatRollup(value, config.aggregation, t, i18n.language)}
      </span>
    </div>
  );
}
