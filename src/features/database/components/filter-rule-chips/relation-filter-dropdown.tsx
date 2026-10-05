import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DatabaseProperty, ID } from "src/types";
import type { RelationFilterRule } from "src/types/filter-types";
import { useRows } from "src/hooks/use-pages";
import { PageItemIcon } from "src/features/pages/page-item/page-item-icon";
import { FilterRuleHeader } from "./filter-rule-header";
import "./select-filter-dropdown.scss";

// Relation filters: pick pages from the related database; a row matches when
// it links to any of them (works on both sides of a two-way relation).

/** Picked page ids of a rule. Older rules hold typed text, not ids. */
function relationRuleIds(rule: RelationFilterRule): string[] {
  return Array.isArray(rule.value) ? rule.value : [];
}

export function RelationFilterDropdown({
  property,
  rule,
  onUpdate,
  onDelete,
  onPromote,
}: {
  property: DatabaseProperty;
  rule: RelationFilterRule;
  onUpdate: (id: ID, patch: Partial<RelationFilterRule>) => void;
  onDelete: (id: ID) => void;
  onPromote: () => void;
}) {
  const { t } = useTranslation();
  const targetSourceId =
    property.config.type === "relation" ? property.config.targetSourceId : "";
  const { data: targetRows = [] } = useRows(targetSourceId || "");

  const ids = relationRuleIds(rule);
  const selected = useMemo(() => new Set(ids), [ids]);
  const [search, setSearch] = useState("");
  const untitled = t("database.relation.untitled");

  // Picked pages first, then the rest A–Z; filtered by the search.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? targetRows.filter((p) => (p.title || "").toLowerCase().includes(q))
      : targetRows;
    return [...list].sort((a, b) => {
      const sa = selected.has(a.id) ? 0 : 1;
      const sb = selected.has(b.id) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [targetRows, search, selected]);

  // Keep value[] and labels[] in step; a page that no longer exists keeps
  // its stored label so the chip still reads well.
  function commit(next: string[]) {
    const labelOf = (id: string) => {
      const page = targetRows.find((p) => p.id === id);
      if (page) return page.title || untitled;
      const i = ids.indexOf(id);
      return rule.labels?.[i] ?? untitled;
    };
    onUpdate(rule.id, { value: next, labels: next.map(labelOf) });
  }

  function toggle(id: string) {
    commit(selected.has(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  return (
    <div className="select-filter-dropdown">
      <FilterRuleHeader
        propertyName={property.name}
        rule={rule}
        onChange={(patch) =>
          onUpdate(rule.id, patch as Partial<RelationFilterRule>)
        }
        onDelete={() => onDelete(rule.id)}
        onPromote={onPromote}
      />
      <input
        className="select-filter-dropdown__search"
        placeholder={t("database.relation.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />

      <div className="select-filter-dropdown__list">
        {rows.length === 0 && (
          <span className="select-filter-dropdown__empty">
            {t("database.relation.none")}
          </span>
        )}
        {rows.map((p) => (
          <button
            type="button"
            key={p.id}
            className="select-filter-dropdown__row"
            onClick={() => toggle(p.id)}
          >
            <span
              className="select-filter-dropdown__checkbox"
              data-checked={selected.has(p.id) || undefined}
              aria-hidden
            />
            <PageItemIcon
              cover={p.cover}
              styles={{ width: 16, height: 16, fontSize: 14 }}
            />
            <span className="tiptap-button-text">{p.title || untitled}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
