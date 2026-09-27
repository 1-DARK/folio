import type { ID } from "src/types";

// The "Learn" row on the home page. Each guide is meant to be a real Folio
// page (written in Folio, published to everyone): set `pageId` once it
// exists and the card opens it. Until then the card shows "Coming soon".
//
// Kept as plain config so guides can be added, reordered or pointed at a
// future documentation engine without touching the home page component.

export type GuideIcon = "start" | "blocks" | "databases" | "collaborate";

export interface HomeGuide {
  id: string;
  icon: GuideIcon;
  /** i18n key + default (English) title. */
  titleKey: string;
  title: string;
  readMinutes: number;
  pageId: ID | null;
}

export const HOME_GUIDES: HomeGuide[] = [
  {
    id: "getting-started",
    icon: "start",
    titleKey: "home.guides.gettingStarted",
    title: "Getting started with Folio",
    readMinutes: 4,
    pageId: null,
  },
  {
    id: "blocks",
    icon: "blocks",
    titleKey: "home.guides.blocks",
    title: "Write with blocks",
    readMinutes: 5,
    pageId: null,
  },
  {
    id: "databases",
    icon: "databases",
    titleKey: "home.guides.databases",
    title: "Organize anything with databases",
    readMinutes: 8,
    pageId: null,
  },
  {
    id: "collaborate",
    icon: "collaborate",
    titleKey: "home.guides.collaborate",
    title: "Work together: comments, suggestions and rooms",
    readMinutes: 6,
    pageId: null,
  },
];
