import { useState } from "react";
import type { Page, PageCover, Person } from "src/types";
import type { TFunction } from "i18next";
import { useRecentPages } from "src/hooks/use-pages";
import { useCreatePage } from "src/hooks/use-create-page";
import { useActivePageActions } from "../pages/context/active-page-context";
import { makePage } from "src/utils/make-page";
import { PageItemIcon } from "../pages/page-item/page-item-icon";
import {
  BookOpen,
  Clock,
  Database,
  LayoutTemplate,
  Plus,
  Rocket,
  SquareStack,
  Users,
  MousePointerClick,
  Box,
} from "lucide-react";
import { useTemplates } from "src/hooks/use-templates";
import { useClonePage } from "src/features/database/hooks/use-clone-page";
import { HOME_GUIDES, type GuideIcon, type HomeGuide } from "./home-guides";
import { ShowcaseReader } from "src/features/showcase/showcase-reader";
import type { ShowcaseId } from "src/features/showcase/showcases";
import { HomeCarousel } from "./home-carousel";
import { useTranslation } from "react-i18next";
import { Greeting } from "src/features/home/greeting/greeting";
import {
  Board,
  BoardContent,
  BoardCover,
  BoardIcon,
  BoardMeta,
  BoardTitle,
} from "src/components/tiptap-ui-primitive/board/board";
import { getPageExcerpt } from "src/lib/get-page-excerpt";
import { useCurrentPerson } from "src/hooks/use-session";
import "./home-page-content.scss";
import { useEditorLayout } from "../shell/context/editor-layout-context";
import { useCurrentWorkspace } from "src/hooks/use-workspaces";
import { useCurrentSpace } from "src/hooks/use-current-space";
import { useIsMobile } from "src/hooks/use-breakpoint";
import { usePeople } from "src/hooks/use-people";
import { Avatar } from "src/components/tiptap-ui-primitive/avatar";

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(134px, 1fr))",
  gap: 12,
};

const SECTION_GAP = 36;
// Card widths in the sideways rows.
const RECENT_CARD_W = 134;
const WIDE_CARD_W = 200;

// cover → CSS background (image > gradient > color), same as the gallery
function coverBackground(cover: PageCover | undefined): string {
  if (cover?.coverImage)
    return `center / cover no-repeat url(${cover.coverImage})`;
  if (cover?.gradient) return cover.gradient;
  if (cover?.color) return cover.color;
  return "var(--tt-hover-bg-color, rgba(0,0,0,0.04))";
}

function formatRelative(ts: number, t: TFunction, locale?: string): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t("home.time.justNow");
  const min = Math.floor(sec / 60);
  if (min < 60) return t("home.time.minutesAgo", { count: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("home.time.hoursAgo", { count: hr });
  const day = Math.floor(hr / 24);
  if (day === 1) return t("home.time.yesterday");
  if (day < 7) return t("home.time.daysAgo", { count: day });
  return new Date(ts).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

const todayLabel = (locale?: string) =>
  new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export function HomePageContent({ userName }: { userName?: string }) {
  const { t, i18n } = useTranslation();
  const { data, isPending } = useRecentPages();
  const { setActivePageId } = useActivePageActions();
  const { collapsed: sidebarCollapsed, expandedWidth } = useEditorLayout();
  const createPage = useCreatePage();
  // Learn guide open in the reader (null = closed).
  const [openGuide, setOpenGuide] = useState<ShowcaseId | null>(null);

  const { person } = useCurrentPerson();
  const { workspaceId } = useCurrentWorkspace();
  const space = useCurrentSpace();
  const teamspaceId = space.kind === "teamspace" ? space.id : null;

  // Home follows the current space: inside a teamspace, only its pages (not
  // the root page itself); in your workspace, everything as before.
  const { data: templates = [] } = useTemplates();
  const { clone, cloning } = useClonePage();

  const recents = (data ?? []).filter(
    (p) =>
      p.category !== "Template" &&
      (teamspaceId == null ||
        (p.teamspaceId === teamspaceId && p.id !== teamspaceId)),
  );

  const newPage = () => {
    if (!person || !workspaceId) return;
    // Inside a teamspace, the new page goes INTO it (child of the root); the
    // server trigger stamps teamspace_id and pins it to the host workspace.
    const page =
      space.kind === "teamspace"
        ? makePage({
            title: t("page.newPage"),
            parentId: space.id,
            category: "Teamspaces",
            ownerId: person.id,
            workspaceId: space.page?.workspaceId ?? workspaceId,
            teamspaceId: space.id,
          })
        : makePage({
            title: t("page.newPage"),
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

  const isMobile = useIsMobile();
  const marginLeftRight = isMobile ? "10px" : "12vw";

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
        overflow: "hidden !important",
      }}
    >
      {/* greeting */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginBottom: 28,
        }}
      >
        <Greeting name={userName} />
        <div style={{ fontSize: 13, color: "var(--tt-theme-muted)" }}>
          {todayLabel(i18n.language)}
        </div>
        {space.kind === "teamspace" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--tt-text-secondary)",
            }}
          >
            {space.page && (
              <PageItemIcon
                cover={space.page.cover}
                styles={{ width: 15, height: 15, fontSize: 15 }}
              />
            )}
            <span>{space.page?.title || t("teamspaces.untitled")}</span>
          </div>
        )}
      </div>

      {isPending ? (
        <CardGridSkeleton />
      ) : recents.length === 0 ? (
        <EmptyState onNewPage={newPage} />
      ) : (
        <>
          {/* recently visited */}
          <HomeCarousel
            title={
              <SectionLabel icon={<Clock size={14} />} flush>
                {t("home.recentlyVisited")}
              </SectionLabel>
            }
            label={t("home.recentlyVisited")}
            cardWidth={RECENT_CARD_W}
            style={{ marginBottom: SECTION_GAP }}
          >
            {recents.map((page) => (
              <RecentCard
                key={page.id}
                page={page}
                onOpen={() => setActivePageId(page.id)}
              />
            ))}
          </HomeCarousel>
        </>
      )}

      {/* learn */}
      <HomeCarousel
        title={
          <SectionLabel icon={<BookOpen size={14} />} flush>
            {t("home.learn", "Learn")}
          </SectionLabel>
        }
        label={t("home.learn", "Learn")}
        cardWidth={WIDE_CARD_W}
        style={{ marginBottom: SECTION_GAP }}
      >
        {HOME_GUIDES.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            onOpen={
              guide.pageId
                ? () => setActivePageId(guide.pageId!)
                : guide.showcaseId
                  ? () => setOpenGuide(guide.showcaseId)
                  : undefined
            }
          />
        ))}
      </HomeCarousel>
      <ShowcaseReader id={openGuide} onClose={() => setOpenGuide(null)} />

      {/* templates */}
      {templates.length > 0 && (
        <>
          <HomeCarousel
            title={
              <SectionLabel icon={<LayoutTemplate size={14} />} flush>
                {t("home.templates", "Start from a template")}
              </SectionLabel>
            }
            label={t("home.templates", "Start from a template")}
            cardWidth={WIDE_CARD_W}
            style={{ marginBottom: SECTION_GAP }}
          >
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                page={tpl}
                disabled={cloning}
                onUse={() => applyTemplate(tpl)}
              />
            ))}
          </HomeCarousel>
        </>
      )}
    </div>
  );
}

function SectionLabel({
  children,
  icon,
  flush = false,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  /** No bottom margin — the carousel header spaces it. */
  flush?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13,
        fontWeight: 500,
        color: "var(--tt-text-secondary, var(--tt-theme-muted))",
        marginBottom: flush ? 0 : 10,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

const GUIDE_ICONS: Record<GuideIcon, typeof BookOpen> = {
  start: Rocket,
  blocks: SquareStack,
  databases: Database,
  collaborate: Users,
  button: MousePointerClick,
  container: Box,
};

// A "Learn" card: a guide page. Without a page yet it reads "Coming soon"
// and isn't clickable.
function GuideCard({
  guide,
  onOpen,
}: {
  guide: HomeGuide;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  const Icon = GUIDE_ICONS[guide.icon];
  const available = !!onOpen;
  return (
    <Board
      className={`recent-card home-guide-card${available ? "" : " is-soon"}`}
      onClick={onOpen}
    >
      <div className="home-guide-card__cover">
        <Icon size={34} strokeWidth={1.4} />
      </div>
      <BoardContent>
        <BoardTitle style={{ fontSize: 14, fontWeight: 600 }}>
          {t(guide.titleKey, guide.title)}
        </BoardTitle>
        <BoardMeta>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <BookOpen size={12} />
            {available
              ? t("home.readMinutes", "{{count}} min read", {
                  count: guide.readMinutes,
                })
              : t("home.comingSoon", "Coming soon")}
          </span>
        </BoardMeta>
      </BoardContent>
    </Board>
  );
}

// A template card: same look as a recent card, click to use it.
function TemplateCard({
  page,
  disabled,
  onUse,
}: {
  page: Page;
  disabled: boolean;
  onUse: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Board
      className={`recent-card home-template-card${disabled ? " is-busy" : ""}`}
      onClick={disabled ? undefined : onUse}
    >
      <BoardCover
        height={96}
        style={{ background: coverBackground(page.cover) }}
      />
      <BoardIcon hang size={20} align="start">
        <PageItemIcon cover={page.cover} styles={{ width: 18, height: 18 }} />
      </BoardIcon>
      <BoardContent>
        <BoardTitle style={{ fontSize: 14, fontWeight: 600 }}>
          {page.title || t("page.untitled")}
        </BoardTitle>
        <span
          style={{
            fontSize: 12,
            color: "var(--tt-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {getPageExcerpt(page)}
        </span>
        <BoardMeta>{t("home.useTemplate", "Use template")}</BoardMeta>
      </BoardContent>
    </Board>
  );
}

function RecentCard({ page, onOpen }: { page: Page; onOpen: () => void }) {
  const { t, i18n } = useTranslation();
  // The page's author (owner), from the shared people query — no extra fetch.
  const { data: people = [] } = usePeople();
  const author = page.ownerId
    ? (people as Person[]).find((p) => p.id === page.ownerId)
    : undefined;
  const edited = formatRelative(
    page.updatedAt ?? page.createdAt,
    t,
    i18n.language,
  );
  return (
    <Board className="recent-card" onClick={onOpen}>
      <BoardCover
        height={68}
        style={{ background: coverBackground(page.cover) }}
      />
      <BoardIcon hang size={20} align="start">
        <PageItemIcon cover={page.cover} styles={{ width: 18, height: 18 }} />
      </BoardIcon>

      <BoardContent>
        <BoardTitle style={{ fontSize: 14, fontWeight: 500 }}>
          {page.title || t("page.untitled")}
        </BoardTitle>

        {/* Author avatar + when it was last edited */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            minWidth: 0,
          }}
          title={
            author
              ? `${author.name} · ${t("home.edited", { time: edited })}`
              : t("home.edited", { time: edited })
          }
        >
          <Avatar
            size="sm"
            src={author?.avatarUrl ?? undefined}
            name={author?.name ?? ""}
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--tt-text-secondary, var(--tt-theme-muted))",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {edited}
          </span>
        </div>
      </BoardContent>
    </Board>
  );
}

function EmptyState({ onNewPage }: { onNewPage: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 300,
      }}
    >
      <button
        type="button"
        onClick={onNewPage}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 26px",
          border: "1px solid var(--tt-border-color)",
          borderRadius: 12,
          background: "var(--tt-bg-color)",
          color: "var(--tt-text-color)",
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <Plus size={19} strokeWidth={1.8} />
        {t("home.newPage")}
      </button>
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div style={GRID}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 124,
            borderRadius: 12,
            border: "0.5px solid var(--tt-border-color)",
            background: "var(--tt-hover-bg-color, rgba(0,0,0,0.03))",
          }}
        />
      ))}
    </div>
  );
}
