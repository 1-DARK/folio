import { useId, useMemo, useState } from "react";
import type { Page, PageCover } from "src/types";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  FileText,
  LayoutTemplate,
  MessagesSquare,
  Plus,
  Search,
} from "lucide-react";
import { useRecentPages } from "src/hooks/use-pages";
import { useCreatePage } from "src/hooks/use-create-page";
import { useActivePageActions } from "../pages/context/active-page-context";
import { makePage } from "src/utils/make-page";
import { PageItemIcon } from "../pages/page-item/page-item-icon";
import { useTemplates } from "src/hooks/use-templates";
import { useClonePage } from "src/features/database/hooks/use-clone-page";
import { HOME_GUIDES, type HomeGuide } from "./home-guides";
import { ShowcaseReader } from "src/features/showcase/showcase-reader";
import type { ShowcaseId } from "src/features/showcase/showcases";
import { Greeting } from "src/features/home/greeting/greeting";
import { getPageExcerpt } from "src/lib/get-page-excerpt";
import { useCurrentPerson } from "src/hooks/use-session";
import { useEditorLayout } from "../shell/context/editor-layout-context";
import { useCurrentWorkspace } from "src/hooks/use-workspaces";
import { useCurrentSpace } from "src/hooks/use-current-space";
import { useIsMobile } from "src/hooks/use-breakpoint";
import { useTeamspacePins } from "src/hooks/use-teamspace-pins";
import { useNotificationState } from "src/features/inbox/notification/notification-context";
import { useUnreadCounts } from "src/hooks/use-chat";
import { InboxIcon } from "src/components/tiptap-icons";
import { useGuidesRead } from "./use-guides-read";
import "./home-page-content.scss";

// Home: search or create first, then favourite (or pinned) pages, then
// recent pages grouped by day, then the next guide to read.

const RECENT_STEP = 10;
const PINNED_MAX = 6;
const SEARCH_MAX = 6;

// cover → CSS background (image > gradient > color), same as the gallery
function coverBackground(cover: PageCover | undefined): string {
  if (cover?.coverImage)
    return `center / cover no-repeat url(${cover.coverImage})`;
  if (cover?.gradient) return cover.gradient;
  if (cover?.color) return cover.color;
  return "var(--tt-border-color-tint)";
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

type GroupId = "today" | "yesterday" | "thisWeek" | "older";

function groupOf(ts: number, now: Date): GroupId {
  const today = startOfDay(now);
  if (ts >= today) return "today";
  if (ts >= today - 86_400_000) return "yesterday";
  if (ts >= today - 6 * 86_400_000) return "thisWeek";
  return "older";
}

// "12 min ago" today, a time yesterday, a weekday this week, a date before.
function whenLabel(
  ts: number,
  group: GroupId,
  t: TFunction,
  locale?: string,
): string {
  if (group === "today") {
    const min = Math.floor((Date.now() - ts) / 60_000);
    if (min < 1) return t("home.time.justNow");
    if (min < 60) return t("home.time.minutesAgo", { count: min });
    return t("home.time.hoursAgo", { count: Math.floor(min / 60) });
  }
  const d = new Date(ts);
  if (group === "yesterday")
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (group === "thisWeek")
    return d.toLocaleDateString(locale, { weekday: "short" });
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

const editedAt = (p: Page) => p.updatedAt ?? p.createdAt;

export function HomePageContent({ userName }: { userName?: string }) {
  const { t, i18n } = useTranslation();
  const { data, isPending } = useRecentPages();
  const { setActivePageId } = useActivePageActions();
  const {
    collapsed: sidebarCollapsed,
    expandedWidth,
    setSidebarView,
    onCollapsedChange,
  } = useEditorLayout();
  const createPage = useCreatePage();
  const [openGuide, setOpenGuide] = useState<ShowcaseId | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [recentLimit, setRecentLimit] = useState(RECENT_STEP);

  const { person } = useCurrentPerson();
  const { workspaceId } = useCurrentWorkspace();
  const space = useCurrentSpace();
  const teamspaceId = space.kind === "teamspace" ? space.id : null;
  const { pinnedIds } = useTeamspacePins(teamspaceId);

  const { data: templates = [] } = useTemplates();
  const { clone, cloning } = useClonePage();
  const { unreadCount } = useNotificationState();
  const { data: chatUnread = {} } = useUnreadCounts();
  const chatTotal = Object.values(chatUnread).reduce((a, b) => a + b, 0);
  const guidesRead = useGuidesRead();

  const allPages = useMemo(() => data ?? [], [data]);

  // Home follows the current space: inside a teamspace, only its pages (not
  // the root page itself); in your workspace, everything.
  const pages = useMemo(
    () =>
      allPages.filter(
        (p) =>
          p.category !== "Template" &&
          (teamspaceId == null ||
            (p.teamspaceId === teamspaceId && p.id !== teamspaceId)),
      ),
    [allPages, teamspaceId],
  );

  // Teamspace: the space's shared pins. Workspace: your favourites.
  const pinned = useMemo(() => {
    if (teamspaceId) {
      return pinnedIds
        .map((id) => allPages.find((p) => p.id === id))
        .filter((p): p is Page => !!p)
        .slice(0, PINNED_MAX);
    }
    return pages.filter((p) => p.category === "Favorites").slice(0, PINNED_MAX);
  }, [teamspaceId, pinnedIds, allPages, pages]);

  // A recent page's place: its teamspace, else Private / Shared.
  const placeOf = (p: Page): string | null => {
    if (teamspaceId) return null;
    if (p.teamspaceId) {
      const root = allPages.find((x) => x.id === p.teamspaceId);
      return root?.title || t("teamspaces.untitled");
    }
    return p.category === "Shared"
      ? t("home.place.shared")
      : t("home.place.private");
  };

  // Recent pages, grouped by the day they were last edited.
  const now = new Date();
  const order: GroupId[] = ["today", "yesterday", "thisWeek", "older"];
  const byGroup = new Map<GroupId, Page[]>();
  for (const p of pages.slice(0, recentLimit)) {
    const g = groupOf(editedAt(p), now);
    byGroup.set(g, [...(byGroup.get(g) ?? []), p]);
  }
  const groups = order
    .filter((g) => byGroup.has(g))
    .map((g) => ({ id: g, items: byGroup.get(g)! }));

  const newPage = (title?: string) => {
    if (!person || !workspaceId) return;
    const name = title?.trim() || t("page.newPage");
    // Inside a teamspace, the new page goes INTO it (child of the root); the
    // server trigger stamps teamspace_id and pins it to the host workspace.
    const page =
      space.kind === "teamspace"
        ? makePage({
            title: name,
            parentId: space.id,
            category: "Teamspaces",
            ownerId: person.id,
            workspaceId: space.page?.workspaceId ?? workspaceId,
            teamspaceId: space.id,
          })
        : makePage({
            title: name,
            parentId: null,
            category: "Private",
            ownerId: person.id,
            workspaceId,
          });
    createPage.mutate(page);
    setActivePageId(page.id);
  };

  // A template is copied into the current space (its teamspace, or your
  // private pages) and opened.
  const applyTemplate = (template: Page) => {
    if (cloning) return;
    void clone(
      template,
      space.kind === "teamspace"
        ? {
            parentId: space.id,
            teamspaceId: space.id,
            category: "Teamspaces",
            generalAccess: "teamspace",
            generalAccessRole: "edit",
          }
        : {},
    );
  };

  const openSidebar = (view: "inbox" | "chats") => {
    setSidebarView(view);
    if (sidebarCollapsed) onCollapsedChange(false);
  };

  const openGuideCard = (guide: HomeGuide) => {
    guidesRead.markRead(guide.id);
    if (guide.pageId) setActivePageId(guide.pageId);
    else if (guide.showcaseId) setOpenGuide(guide.showcaseId);
  };

  const isMobile = useIsMobile();
  const marginLeftRight = isMobile ? "16px" : "12vw";

  return (
    <div
      className="home-page-content"
      style={{
        maxWidth: "100%",
        margin: isMobile
          ? `0 ${marginLeftRight}`
          : sidebarCollapsed
            ? `0 ${marginLeftRight}`
            : "0 auto",
        paddingLeft: sidebarCollapsed ? 0 : expandedWidth,
      }}
    >
      <div className="home-calm">
        <header className="home-calm__header">
          <Greeting name={userName} />
          {space.kind === "teamspace" && (
            <div className="home-calm__space">
              {space.page && (
                <PageItemIcon
                  cover={space.page.cover}
                  styles={{ width: 15, height: 15, fontSize: 15 }}
                />
              )}
              <span>{space.page?.title || t("teamspaces.untitled")}</span>
            </div>
          )}

          <HomeSearch
            pages={pages}
            onOpen={(p) => setActivePageId(p.id)}
            onCreate={newPage}
          />

          <div className="home-calm__actions">
            <button
              type="button"
              className="home-chip"
              onClick={() => newPage()}
            >
              <Plus size={15} aria-hidden />
              {t("home.newPage")}
            </button>
            {templates.length > 0 && (
              <button
                type="button"
                className="home-chip"
                aria-expanded={showTemplates}
                aria-controls="home-templates"
                onClick={() => setShowTemplates((v) => !v)}
              >
                <LayoutTemplate size={15} aria-hidden />
                {t("home.actions.template")}
              </button>
            )}
            <button
              type="button"
              className="home-chip"
              onClick={() => openSidebar("inbox")}
            >
              <InboxIcon className="home-chip__icon" aria-hidden />
              {t("home.actions.inbox")}
              {unreadCount > 0 && (
                <span className="home-chip__badge">{unreadCount}</span>
              )}
            </button>
            <button
              type="button"
              className="home-chip"
              onClick={() => openSidebar("chats")}
            >
              <MessagesSquare size={15} aria-hidden />
              {t("home.actions.chats")}
              {chatTotal > 0 && (
                <span className="home-chip__badge">{chatTotal}</span>
              )}
            </button>
          </div>

          {showTemplates && templates.length > 0 && (
            <div
              id="home-templates"
              className="home-calm__templates"
              role="group"
              aria-label={t("home.actions.template")}
            >
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="home-template"
                  disabled={cloning}
                  onClick={() => applyTemplate(tpl)}
                >
                  <PageItemIcon
                    cover={tpl.cover}
                    styles={{ width: 16, height: 16, fontSize: 16 }}
                  />
                  <span className="home-template__title">
                    {tpl.title || t("page.untitled")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </header>

        {isPending ? (
          <RecentSkeleton />
        ) : pages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {pinned.length > 0 && (
              <section
                className="home-calm__section"
                aria-labelledby="home-pinned"
              >
                <h2 id="home-pinned" className="home-calm__label">
                  {teamspaceId ? t("home.pinned") : t("home.favorites")}
                </h2>
                <div className="home-pinned">
                  {pinned.map((p) => (
                    <PinnedCard
                      key={p.id}
                      page={p}
                      onOpen={() => setActivePageId(p.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section
              className="home-calm__section"
              aria-labelledby="home-recent"
            >
              <h2 id="home-recent" className="home-calm__label">
                {t("home.recent")}
              </h2>
              {groups.map((g) => (
                <div key={g.id} className="home-recent__group">
                  <h3 className="home-recent__day">{t(`home.day.${g.id}`)}</h3>
                  <ul className="home-recent">
                    {g.items.map((p) => {
                      const place = placeOf(p);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="home-recent__row"
                            onClick={() => setActivePageId(p.id)}
                          >
                            <span className="home-recent__icon">
                              <PageItemIcon
                                cover={p.cover}
                                styles={{ width: 16, height: 16, fontSize: 16 }}
                              />
                            </span>
                            <span className="home-recent__title">
                              {p.title || t("page.untitled")}
                            </span>
                            {place && (
                              <span className="home-recent__place">
                                {place}
                              </span>
                            )}
                            <span className="home-recent__when">
                              {whenLabel(editedAt(p), g.id, t, i18n.language)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {pages.length > recentLimit && (
                <button
                  type="button"
                  className="home-calm__more"
                  onClick={() => setRecentLimit((n) => n + RECENT_STEP)}
                >
                  {t("home.showMore")}
                </button>
              )}
            </section>
          </>
        )}

        <LearnBanner
          guides={HOME_GUIDES}
          readIds={guidesRead.readIds}
          onOpen={openGuideCard}
        />
      </div>
      <ShowcaseReader id={openGuide} onClose={() => setOpenGuide(null)} />
    </div>
  );
}

// ── Search or create ────────────────────────────────────────────────────────
// Filters the space's pages by title as you type; Enter opens the highlighted
// page, or creates a page with the typed title when that row is highlighted.
function HomeSearch({
  pages,
  onOpen,
  onCreate,
}: {
  pages: Page[];
  onOpen: (page: Page) => void;
  onCreate: (title: string) => void;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      q
        ? pages
            .filter((p) => (p.title || "").toLowerCase().includes(q))
            .slice(0, SEARCH_MAX)
        : [],
    [pages, q],
  );
  // The last row creates a page with the typed title.
  const rowCount = q ? matches.length + 1 : 0;
  const showList = open && rowCount > 0;
  const activeRow = Math.min(active, Math.max(rowCount - 1, 0));

  const choose = (index: number) => {
    if (index < matches.length) onOpen(matches[index]);
    else onCreate(query);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="home-search">
      <label className="home-search__box">
        <Search size={18} aria-hidden className="home-search__icon" />
        <span className="home-visually-hidden">{t("home.search.label")}</span>
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList ? `${listId}-${activeRow}` : undefined
          }
          className="home-search__input"
          placeholder={t("home.search.placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (!rowCount) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((activeRow + 1) % rowCount);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((activeRow - 1 + rowCount) % rowCount);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(activeRow);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>

      {showList && (
        <ul id={listId} role="listbox" className="home-search__list">
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeRow}
              className="home-search__option"
              // Keep focus in the input so the list stays open until chosen.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <PageItemIcon
                cover={p.cover}
                styles={{ width: 16, height: 16, fontSize: 16 }}
              />
              <span className="home-search__option-title">
                {p.title || t("page.untitled")}
              </span>
            </li>
          ))}
          <li
            id={`${listId}-${matches.length}`}
            role="option"
            aria-selected={activeRow === matches.length}
            className="home-search__option home-search__option--create"
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(matches.length)}
            onClick={() => choose(matches.length)}
          >
            <Plus size={16} aria-hidden />
            <span className="home-search__option-title">
              {t("home.search.create", { title: query.trim() })}
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

function PinnedCard({ page, onOpen }: { page: Page; onOpen: () => void }) {
  const { t } = useTranslation();
  const excerpt = getPageExcerpt(page);
  return (
    <button type="button" className="home-pin" onClick={onOpen}>
      <span
        className="home-pin__cover"
        style={{ background: coverBackground(page.cover) }}
      />
      <span className="home-pin__body">
        <span className="home-pin__title">
          <PageItemIcon
            cover={page.cover}
            styles={{ width: 16, height: 16, fontSize: 16 }}
          />
          <span>{page.title || t("page.untitled")}</span>
        </span>
        {excerpt && <span className="home-pin__excerpt">{excerpt}</span>}
      </span>
    </button>
  );
}

// ── Learn Folio ─────────────────────────────────────────────────────────────
// One line: how many guides you've opened and the next one to read. With
// every guide read it becomes a quiet link to the full list.
function LearnBanner({
  guides,
  readIds,
  onOpen,
}: {
  guides: HomeGuide[];
  readIds: string[];
  onOpen: (guide: HomeGuide) => void;
}) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const available = guides.filter((g) => g.showcaseId || g.pageId);
  if (available.length === 0) return null;
  const read = available.filter((g) => readIds.includes(g.id)).length;
  const next = available.find((g) => !readIds.includes(g.id));

  return (
    <section className="home-calm__section" aria-labelledby="home-learn">
      <div className="home-learn">
        {next ? (
          <button
            type="button"
            className="home-learn__next"
            onClick={() => onOpen(next)}
          >
            <span className="home-learn__text">
              <span id="home-learn" className="home-learn__kicker">
                {t("home.learnProgress", {
                  read,
                  total: available.length,
                })}
              </span>
              <span className="home-learn__title">
                {read === 0
                  ? t("home.learnStart", {
                      title: t(next.titleKey, next.title),
                    })
                  : t("home.learnContinue", {
                      title: t(next.titleKey, next.title),
                    })}
              </span>
            </span>
            <span className="home-learn__meta">
              {t("home.readMinutes", "{{count}} min read", {
                count: next.readMinutes,
              })}
              <ChevronRight size={16} aria-hidden />
            </span>
          </button>
        ) : (
          <span id="home-learn" className="home-learn__done">
            {t("home.learnDone")}
          </span>
        )}
        <button
          type="button"
          className="home-learn__toggle"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? t("home.learnHide") : t("home.learnAll")}
        </button>
      </div>
      {showAll && (
        <ul className="home-recent">
          {available.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="home-recent__row"
                onClick={() => onOpen(g)}
              >
                <span className="home-recent__icon">
                  <FileText size={16} aria-hidden />
                </span>
                <span className="home-recent__title">
                  {t(g.titleKey, g.title)}
                </span>
                <span className="home-recent__when">
                  {readIds.includes(g.id)
                    ? t("home.learnRead")
                    : t("home.readMinutes", "{{count}} min read", {
                        count: g.readMinutes,
                      })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// No pages yet: the search box and New page above are the way in.
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="home-empty">
      <p className="home-empty__title">{t("home.emptyTitle")}</p>
      <p className="home-empty__desc">{t("home.emptyDesc")}</p>
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="home-calm__section" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="home-skeleton-row" />
      ))}
    </div>
  );
}
