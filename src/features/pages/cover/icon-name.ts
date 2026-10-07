import { iconNames } from "lucide-react/dynamic";

// `lucide-react/dynamic` lazily imports a single icon by its kebab-case name,
// so nothing here pulls the whole Lucide namespace into the eager bundle — the
// page-header icon stays a one-icon fetch. `iconNames` is the full kebab list,
// used for O(1) validation so an unknown/removed name renders the fallback
// instead of nothing.
const VALID = new Set<string>(iconNames as readonly string[]);

// Legacy semantic keys still passed in by the database property panels and a
// couple of buttons (these were the old Material ligature names) → their Lucide
// kebab equivalents. Anything not in here is assumed to already be a Lucide
// name (that's what the icon picker now stores).
const ALIASES: Record<string, string> = {
  match_case: "case-sensitive",
  notes: "align-left",
  tag: "hash",
  check_box: "square-check",
  expand_circle_down: "circle-chevron-down",
  list: "list",
  arrow_upload_progress: "loader-circle",
  calendar_today: "calendar",
  person: "user",
  functions: "square-function",
  sync_alt: "arrow-left-right",
  swap_vert: "arrow-up-down",
  link: "link",
  call: "phone",
  mail: "mail",
  schedule: "clock",
  person_add: "user-plus",
  edit: "pencil",
  delete: "trash-2",
};

const FALLBACK = "file-text";

/** The Lucide name an icon renders as (aliases applied, unknown → fallback).
 *  Shared by DynamicIcon and the browser-tab favicon so both draw the same
 *  icon. */
export function resolveIconName(name?: string): string {
  if (!name) return FALLBACK;
  const mapped = ALIASES[name] ?? name;
  return VALID.has(mapped) ? mapped : FALLBACK;
}
