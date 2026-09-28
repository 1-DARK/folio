import type { JSONContent } from "@tiptap/react";
import { gettingStarted } from "./content/getting-started";
import { blocks } from "./content/blocks";
import { databases } from "./content/databases";
import { collaborate } from "./content/collaborate";
import { teamWiki } from "./content/team-wiki";
import { projectTracker } from "./content/project-tracker";
import { meetingNotes } from "./content/meeting-notes";
import { course } from "./content/course";

// Showcase pages: Folio documents that ship with the app, shown read-only.
// The home page's Learn cards open the guides; the landing page shows the
// others (and the guides) live instead of screenshots.

export type ShowcaseLang = "en" | "fr";

export type ShowcaseId =
  | "getting-started"
  | "blocks"
  | "databases"
  | "collaborate"
  | "team-wiki"
  | "project-tracker"
  | "meeting-notes"
  | "course";

export const SHOWCASES: Record<ShowcaseId, Record<ShowcaseLang, JSONContent>> = {
  "getting-started": gettingStarted,
  blocks,
  databases,
  collaborate,
  "team-wiki": teamWiki,
  "project-tracker": projectTracker,
  "meeting-notes": meetingNotes,
  course,
};

/** i18next language → showcase language (French unless English). */
export function showcaseLang(language: string | undefined): ShowcaseLang {
  return language?.startsWith("en") ? "en" : "fr";
}

export function getShowcase(id: ShowcaseId, lang: ShowcaseLang): JSONContent {
  return SHOWCASES[id][lang];
}

/** The page title (its first title node), e.g. for a card or a dialog label. */
export function showcaseTitle(id: ShowcaseId, lang: ShowcaseLang): string {
  const titleNode = getShowcase(id, lang).content?.find((n) => n.type === "title");
  return titleNode?.content?.map((t) => t.text ?? "").join("") ?? "";
}
