import i18n from "src/i18n/config";
import type { SlashCommand } from "./slash-commands";

// Search for the slash menu: an item matches its title in English AND in
// French (whatever the interface language), plus a few extra words people
// type for it in either language. Accents and case are ignored.

/** Extra search words per item id, English and French mixed. */
const KEYWORDS: Record<string, string> = {
  p: "text paragraph plain texte paragraphe brut",
  h1: "heading title h1 big titre grand entete",
  h2: "heading title h2 subtitle titre sous-titre",
  h3: "heading title h3 small titre petit",
  h4: "heading title h4 titre",
  h5: "heading title h5 titre",
  h6: "heading title h6 titre",
  bulletList: "bullet list unordered ul dash liste puces tiret",
  orderedList: "numbered ordered list ol 1. liste numerotee ordonnee",
  taskList: "todo to-do task checklist checkbox tache taches cocher case",
  separator: "divider separator line hr rule separateur ligne trait",
  breadcrumb: "breadcrumb path location fil ariane chemin emplacement",
  quote: "quote blockquote citation guillemets",
  codeBlock: "code snippet pre program bloc extrait programme",
  table: "table grid rows columns spreadsheet tableau grille lignes colonnes",
  toc: "table of contents toc outline summary sommaire table des matieres plan",
  column2: "columns layout side by side colonnes mise en page cote a cote",
  column3: "columns layout three colonnes trois mise en page",
  column4: "columns layout four colonnes quatre mise en page",
  tabs: "tabs tabbed panels onglets panneaux",
  codeGroup: "code group tabs languages groupe code onglets langages",
  mention: "mention person people user page @ personne utilisateur lien",
  emoji: "emoji smiley icon emoticone smiley icone",
  mathBlock:
    "math equation latex formula katex block maths equation formule bloc",
  mathInline: "math equation latex formula katex inline maths formule en ligne",
  image: "image picture photo upload img illustration importer",
  file: "file attachment upload pdf document fichier piece jointe importer",
  video: "video youtube vimeo loom mp4 movie film embed integrer",
  bookmark: "bookmark link url web preview card marque-page lien apercu carte",
  "page-1": "page subpage new nested sous-page nouvelle",
  audio: "audio sound music podcast mp3 son musique",
  callout:
    "callout note tip warning info box encadre astuce avertissement boite",
  appendix:
    "toggle collapse fold details accordion annexe repliable plier deplier",
  "toggle-heading-1": "toggle heading collapse fold titre repliable plier",
  "toggle-heading-2": "toggle heading collapse fold titre repliable plier",
  "toggle-heading-3": "toggle heading collapse fold titre repliable plier",
  button: "button cta link call to action bouton lien",
  container: "container box frame section wrapper conteneur boite cadre",
  "database-view":
    "database table board kanban list view base de donnees vue tableau liste",
};

const COLOR_WORDS = "color colour highlight background couleur surligner fond";

/** Lowercase, no accents, single spaces. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Titles in both languages, keyed by i18n key — the commands only carry the
// title already translated, so the other language is looked up here.
const tEn = () => i18n.getFixedT("en");
const tFr = () => i18n.getFixedT("fr");

function titleKeyOf(cmd: SlashCommand): string | null {
  if (cmd.id === "p") return "slash.items.text.title";
  if (cmd.id === "page-1") return "slash.items.page.title";
  if (cmd.id === "appendix") return "slash.appendix";
  if (cmd.id === "database-view") return "slash.items.database.title";
  const tg = /^toggle-heading-(\d)$/.exec(cmd.id);
  if (tg) return `slash.items.toggleHeading${tg[1]}.title`;
  const color = /^color-(?:text-)?(\w+)$/.exec(cmd.id);
  if (color) return `slash.colors.${color[1]}`;
  return `slash.items.${cmd.id}.title`;
}

const haystackCache = new Map<string, { titles: string[]; words: string }>();

function haystack(cmd: SlashCommand) {
  const cacheKey = `${cmd.id}|${cmd.title}`;
  const hit = haystackCache.get(cacheKey);
  if (hit) return hit;
  const key = titleKeyOf(cmd);
  const titles = [cmd.title];
  if (key) {
    for (const t of [tEn(), tFr()]) {
      const v: string = t(key);
      if (v && v !== key) titles.push(v);
    }
  }
  const isColor = cmd.id.startsWith("color-");
  const words = normalize(
    [KEYWORDS[cmd.id] ?? "", isColor ? COLOR_WORDS : ""].join(" "),
  );
  const value = { titles: [...new Set(titles.map(normalize))], words };
  haystackCache.set(cacheKey, value);
  return value;
}

/**
 * How well a command matches the query: 0 = no match, higher is better.
 * Title prefix > word prefix in a title > anywhere in a title > keyword.
 */
export function scoreSlashItem(cmd: SlashCommand, query: string): number {
  const q = normalize(query);
  if (!q) return 1;
  const { titles, words } = haystack(cmd);
  let best = 0;
  for (const title of titles) {
    if (title.startsWith(q)) best = Math.max(best, 4);
    else if (title.split(" ").some((w) => w.startsWith(q)))
      best = Math.max(best, 3);
    else if (title.includes(q)) best = Math.max(best, 2);
  }
  if (best) return best;
  // Every typed word must start a keyword ("table cont" → table of contents).
  const kw = words.split(" ");
  const parts = q.split(" ");
  if (parts.every((part) => kw.some((w) => w.startsWith(part)))) return 1;
  return 0;
}

// ── Recently used ──────────────────────────────────────────────────────────
// Kept per browser; best effort (storage may be blocked).

const RECENT_KEY = "folio.slash.recent";
const RECENT_MAX = 5;
export const RECENT_PREFIX = "recent:";

export function getRecentSlashIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function recordSlashUse(id: string) {
  const base = baseSlashId(id);
  // Colors are a one-off choice, not worth a slot.
  if (base.startsWith("color-")) return;
  try {
    const next = [base, ...getRecentSlashIds().filter((x) => x !== base)];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, RECENT_MAX)));
  } catch {
    // ignore
  }
}

/** "recent:h1" → "h1". */
export function baseSlashId(id: string): string {
  return id.startsWith(RECENT_PREFIX) ? id.slice(RECENT_PREFIX.length) : id;
}
