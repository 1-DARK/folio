import { StatusFilterDropdown } from "./status-filter-dropdown";
import { SelectFilterDropdown } from "./select-filter-dropdown";
import { TextFilterDropdown } from "./text-filter-dropdown";
import { PersonFilterDropdown } from "./person-filter-dropdown";
import { RelationFilterDropdown } from "./relation-filter-dropdown";
// import { DateFilterDropdown } from "./date-filter-dropdown"; // when built
import type { DatabaseProperty, ID } from "src/types";
import type { FilterRule } from "src/types/filter-types";
import { DateFilterDropdown } from "./date-filter-dropdown";

export function SimpleFilterEditor({
  property,
  rule,
  onUpdate,
  onDelete,
  onPromote,
}: {
  property: DatabaseProperty;
  rule: FilterRule;
  onUpdate: (id: ID, patch: Partial<FilterRule>) => void;
  onDelete: (id: ID) => void;
  onPromote: () => void;
}) {
  const shared = { property, rule, onUpdate, onDelete, onPromote } as const;

  switch (rule.propertyType) {
    case "status":
      return <StatusFilterDropdown {...shared} rule={rule} />;

    case "select":
    case "multi_select":
      return <SelectFilterDropdown {...shared} rule={rule} />;

    case "date":
    case "created_time":
    case "edited_time":
      return <DateFilterDropdown {...shared} rule={rule} />;

    case "person":
    case "created_by":
    case "edited_by":
      return <PersonFilterDropdown {...shared} rule={rule} />;

    case "relation":
      // Picked pages; an older rule with typed text keeps the text editor.
      return Array.isArray(rule.value) ? (
        <RelationFilterDropdown {...shared} rule={rule} />
      ) : (
        <TextFilterDropdown {...shared} rule={rule} />
      );

    default:
      // title, text, url, email, phone, number, formula…
      return <TextFilterDropdown {...shared} rule={rule} />;
  }
}
