import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  AtSign,
  BookOpen,
  Box,
  Building2,
  ChevronRight,
  Code2,
  Columns3,
  Database,
  FileText,
  Hash,
  Image as ImageIcon,
  LayoutTemplate,
  List,
  ListChecks,
  Menu,
  MessageSquareText,
  Moon,
  MousePointer2,
  PanelsTopLeft,
  PenLine,
  Quote,
  Sigma,
  Sun,
  Table2,
  Users,
  Video,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  LANDING_COPY,
  TOUR,
  type GroupId,
  type LandingCopy,
  type LandingLang,
  type SectionId,
  type SectionVisual,
  type ShotId,
} from "./landing-copy";
import { LANDING_SHOTS } from "./landing-shots";
import { FolioMark } from "../../components/brand/folio-mark";
import { ShowcaseViewer } from "../showcase/showcase-viewer";
import { ShowcasePreview } from "../showcase/showcase-preview";
import {
  SHOWCASES,
  getShowcase,
  showcaseTitle,
  type ShowcaseId,
} from "../showcase/showcases";
import { snippets } from "../showcase/content/snippets";
import "./landing.scss";

// ── Theme ─────────────────────────────────────────────────────────────────
type LandingTheme = "light" | "dark";
const THEME_KEY = "folio-landing-theme";

function initialTheme(): LandingTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage blocked */
  }
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// ── Routes: #/section or #/section/example ────────────────────────────────
interface Route {
  section: SectionId;
  example: ShowcaseId | null;
}

const ALL_SECTIONS: SectionId[] = [
  "overview",
  ...TOUR.groups.flatMap((g) => g.sections),
];

function parseHash(hash: string): Route {
  const [s, e] = hash.replace(/^#\/?/, "").split("/");
  const section = (ALL_SECTIONS as string[]).includes(s)
    ? (s as SectionId)
    : "overview";
  const example = e && e in SHOWCASES ? (e as ShowcaseId) : null;
  return { section, example };
}

const sectionHref = (s: SectionId) => (s === "overview" ? "#/" : `#/${s}`);
const exampleHref = (s: SectionId, e: ShowcaseId) => `#/${s}/${e}`;

const groupOf = (s: SectionId): GroupId | null =>
  TOUR.groups.find((g) => g.sections.includes(s))?.id ?? null;

// ── Icons ─────────────────────────────────────────────────────────────────
const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  overview: PanelsTopLeft,
  editor: PenLine,
  blocks: Box,
  covers: ImageIcon,
  templates: LayoutTemplate,
  workspaces: Building2,
  teamspaces: Users,
  databases: Database,
  collaboration: MousePointer2,
  comments: MessageSquareText,
  rooms: Hash,
  offline: WifiOff,
};
const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  write: PenLine,
  organize: Building2,
  together: Users,
  anywhere: WifiOff,
};
// One icon per block group item, in LANDING_COPY.blockGroups order.
const BLOCK_ICONS: LucideIcon[][] = [
  [FileText, ListChecks, ChevronRight, MessageSquareText, Quote, AtSign],
  [Columns3, PanelsTopLeft, Table2, List, FileText, Database],
  [ImageIcon, FileText, Video, Video, BookOpen],
  [Code2, Code2, Sigma, ArrowRight, Box],
];

/**
 * The public page signed-out visitors see at "/": a product tour laid out
 * like a Folio workspace. The sidebar is a page tree (Overview, then one
 * page per feature, with their examples under them); each feature page ends
 * with "Try it yourself" examples that open as editable pages. French and
 * English (follows i18next), light and dark (follows the system until
 * toggled, remembered per browser).
 */
export function Landing({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  const { i18n } = useTranslation();
  const lang: LandingLang = i18n.language?.startsWith("en") ? "en" : "fr";
  const c = LANDING_COPY[lang];

  const [theme, setTheme] = useState<LandingTheme>(initialTheme);
  const [route, setRoute] = useState<Route>(() =>
    parseHash(typeof window !== "undefined" ? window.location.hash : ""),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<GroupId>>(() => {
    const g = groupOf(route.section);
    return new Set(g ? [g] : ["write"]);
  });
  const mainRef = useRef<HTMLElement | null>(null);

  // Follow the address bar (links, back / forward): new page → drawer
  // closed, its group open in the tree.
  useEffect(() => {
    const onHash = () => {
      const next = parseHash(window.location.hash);
      setRoute(next);
      setDrawerOpen(false);
      const g = groupOf(next.section);
      if (g) setOpenGroups((prev) => (prev.has(g) ? prev : new Set(prev).add(g)));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // New page: back to the top.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [route.section, route.example]);

  const toggleTheme = () => {
    const next: LandingTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked */
    }
  };

  const toggleGroup = (g: GroupId) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  return (
    <div
      className={`landing${drawerOpen ? " is-drawer-open" : ""}`}
      data-theme={theme}
      lang={lang}
    >
      <Sidebar
        c={c}
        lang={lang}
        route={route}
        openGroups={openGroups}
        onToggleGroup={toggleGroup}
        onClose={() => setDrawerOpen(false)}
      />
      <button
        type="button"
        className="landing-backdrop"
        aria-label={c.header.menu}
        tabIndex={-1}
        onClick={() => setDrawerOpen(false)}
      />

      <div className="landing-column">
        <header className="landing-header">
          <button
            type="button"
            className="landing-icon-btn landing-menu-btn"
            aria-label={c.header.menu}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <Menu size={18} />
          </button>
          <a href="#/" className="landing-header__logo">
            <FolioMark size={22} title="" />
            Folio
          </a>
          <div className="landing-header__spacer" />
          <div className="landing-lang" role="group" aria-label={c.header.language}>
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                className={lang === l ? "is-active" : undefined}
                onClick={() => void i18n.changeLanguage(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="landing-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? c.header.themeLight : c.header.themeDark}
            title={theme === "dark" ? c.header.themeLight : c.header.themeDark}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="landing-link-btn" onClick={onSignIn}>
            {c.header.signIn}
          </button>
          <button
            type="button"
            className="landing-btn landing-btn--primary landing-btn--sm"
            onClick={onGetStarted}
          >
            {c.header.cta}
          </button>
        </header>

        <main ref={mainRef} className="landing-main">
          {route.example ? (
            <ExampleView
              key={`${route.section}/${route.example}`}
              c={c}
              lang={lang}
              route={route as Route & { example: ShowcaseId }}
              theme={theme}
              onGetStarted={onGetStarted}
            />
          ) : route.section === "overview" ? (
            <OverviewView
              c={c}
              lang={lang}
              theme={theme}
              onGetStarted={onGetStarted}
              onSignIn={onSignIn}
            />
          ) : (
            <SectionView c={c} lang={lang} section={route.section} theme={theme} />
          )}
          <footer className="landing-footer">
            <span className="landing-footer__brand">
              <FolioMark size={18} title="" />
              Folio
            </span>
            <span className="landing-muted">{c.footer.tagline}</span>
            <span className="landing-muted">{c.footer.legal}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

// ── Sidebar: logo + page tree ─────────────────────────────────────────────
function Sidebar({
  c,
  lang,
  route,
  openGroups,
  onToggleGroup,
  onClose,
}: {
  c: LandingCopy;
  lang: LandingLang;
  route: Route;
  openGroups: Set<GroupId>;
  onToggleGroup: (g: GroupId) => void;
  onClose: () => void;
}) {
  const isCurrent = (s: SectionId) => route.section === s && !route.example;
  return (
    <nav className="landing-sidebar" aria-label={c.header.tour}>
      <div className="landing-sidebar__top">
        <a href="#/" className="landing-logo">
          <FolioMark size={24} title="" />
          Folio
        </a>
        <button
          type="button"
          className="landing-icon-btn landing-sidebar__close"
          aria-label={c.header.menu}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <ul className="landing-tree" role="list">
        <li>
          <TreeLink
            href={sectionHref("overview")}
            icon={SECTION_ICONS.overview}
            label={c.sections.overview.label}
            depth={0}
            current={isCurrent("overview")}
          />
        </li>
        {TOUR.groups.map((g) => {
          const open = openGroups.has(g.id);
          const GIcon = GROUP_ICONS[g.id];
          return (
            <li key={g.id}>
              <button
                type="button"
                className="landing-tree__row landing-tree__row--group"
                aria-expanded={open}
                onClick={() => onToggleGroup(g.id)}
                style={{ paddingLeft: 4 }}
              >
                <ChevronRight
                  size={13}
                  className="landing-tree__chevron"
                  style={{ transform: open ? "rotate(90deg)" : undefined }}
                />
                <GIcon size={16} className="landing-tree__icon" />
                <span>{c.groups[g.id]}</span>
              </button>
              {open && (
                <ul role="list">
                  {g.sections.map((s) => {
                    const tries = TOUR.tries[s] ?? [];
                    const showTries = route.section === s && tries.length > 0;
                    return (
                      <li key={s}>
                        <TreeLink
                          href={sectionHref(s)}
                          icon={SECTION_ICONS[s]}
                          label={c.sections[s].label}
                          depth={1}
                          current={isCurrent(s)}
                          expandable={tries.length > 0}
                          expanded={showTries}
                        />
                        {showTries && (
                          <ul role="list">
                            {tries.map((e) => (
                              <li key={e}>
                                <TreeLink
                                  href={exampleHref(s, e)}
                                  icon={FileText}
                                  label={showcaseTitle(e, lang)}
                                  depth={2}
                                  current={route.example === e}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TreeLink({
  href,
  icon: Icon,
  label,
  depth,
  current,
  expandable = false,
  expanded = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  depth: number;
  current: boolean;
  expandable?: boolean;
  expanded?: boolean;
}) {
  return (
    <a
      href={href}
      className={`landing-tree__row${current ? " is-current" : ""}`}
      aria-current={current ? "page" : undefined}
      style={{ paddingLeft: 4 + depth * 16 }}
    >
      <span className="landing-tree__chevron-slot">
        {expandable && (
          <ChevronRight
            size={13}
            className="landing-tree__chevron"
            style={{ transform: expanded ? "rotate(90deg)" : undefined }}
          />
        )}
      </span>
      <Icon size={16} className="landing-tree__icon" />
      <span className="landing-tree__label">{label}</span>
    </a>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────
function OverviewView({
  c,
  lang,
  theme,
  onGetStarted,
  onSignIn,
}: {
  c: LandingCopy;
  lang: LandingLang;
  theme: LandingTheme;
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  const tourSections = TOUR.groups.flatMap((g) => g.sections);
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <h1>{c.hero.title}</h1>
        <p className="landing-lead">{c.hero.lead}</p>
        <div className="landing-actions">
          <button
            type="button"
            className="landing-btn landing-btn--primary"
            onClick={onGetStarted}
          >
            {c.hero.primary}
          </button>
          <a href={sectionHref("editor")} className="landing-btn landing-btn--secondary">
            {c.hero.secondary}
          </a>
        </div>
      </section>

      <LiveEditor
        c={c}
        lang={lang}
        theme={theme}
        examples={TOUR.tries.overview ?? []}
      />
      <TryLinks c={c} lang={lang} section="overview" />

      <section className="landing-block">
        <h2 className="landing-h2">{c.tour}</h2>
        <div className="landing-grid landing-grid--3">
          {tourSections.map((s) => {
            const Icon = SECTION_ICONS[s];
            return (
              <a key={s} href={sectionHref(s)} className="landing-card landing-card--link">
                <span className="landing-card__icon">
                  <Icon size={18} />
                </span>
                <span className="landing-card__title">{c.sections[s].label}</span>
                <span className="landing-muted">{c.sections[s].blurb}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="landing-block">
        <h2 className="landing-h2">{c.roles.title}</h2>
        <div className="landing-grid landing-grid--3">
          {c.roles.items.map((r) => (
            <div key={r.title} className="landing-card landing-card--padded">
              <span className="landing-card__title">{r.title}</span>
              <span className="landing-muted">{r.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <h2>{c.final.title}</h2>
        <p className="landing-lead">{c.final.sub}</p>
        <div className="landing-actions">
          <button
            type="button"
            className="landing-btn landing-btn--primary"
            onClick={onGetStarted}
          >
            {c.final.primary}
          </button>
          <button
            type="button"
            className="landing-btn landing-btn--secondary"
            onClick={onSignIn}
          >
            {c.final.secondary}
          </button>
        </div>
      </section>
    </div>
  );
}

// ── A feature page ────────────────────────────────────────────────────────
function SectionView({
  c,
  lang,
  section,
  theme,
}: {
  c: LandingCopy;
  lang: LandingLang;
  section: Exclude<SectionId, "overview">;
  theme: LandingTheme;
}) {
  const s = c.sections[section];
  const g = groupOf(section);
  const visual = TOUR.visuals[section];
  return (
    <div className="landing-page">
      <header className="landing-page__head">
        {g && <span className="landing-crumb">{c.groups[g]}</span>}
        <h1 className="landing-h1">{s.heading}</h1>
        <p className="landing-lead">{s.lead}</p>
      </header>

      <Visual c={c} lang={lang} visual={visual} theme={theme} />

      {s.points && (
        <div className="landing-grid landing-grid--3">
          {s.points.map((p) => (
            <div key={p.title} className="landing-point">
              <span className="landing-card__title">{p.title}</span>
              <span className="landing-muted">{p.body}</span>
            </div>
          ))}
        </div>
      )}

      <TryLinks c={c} lang={lang} section={section} />
      <NextLink c={c} section={section} />
    </div>
  );
}

function Visual({
  c,
  lang,
  visual,
  theme,
}: {
  c: LandingCopy;
  lang: LandingLang;
  visual: SectionVisual;
  theme: LandingTheme;
}) {
  switch (visual.kind) {
    case "editor":
      return <LiveEditor c={c} lang={lang} theme={theme} examples={visual.examples} />;
    case "shot":
      return <Shot id={visual.shot} label={c.shot[visual.shot]} ratio={visual.ratio} />;
    case "blocks":
      return (
        <div className="landing-grid landing-grid--4 landing-blocks">
          {c.blockGroups.map((grp, gi) => (
            <section key={grp.title} className="landing-blocks__group">
              <h2 className="landing-eyebrow">{grp.title}</h2>
              {grp.items.map((it, ii) => {
                const Icon = BLOCK_ICONS[gi]?.[ii] ?? Box;
                return (
                  <div key={it.name} className="landing-blocks__item">
                    <span className="landing-card__icon">
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="landing-blocks__name">{it.name}</span>
                      <span className="landing-muted landing-blocks__body">{it.body}</span>
                    </span>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      );
    case "templates":
      return (
        <div className="landing-grid landing-grid--2">
          {(TOUR.tries.templates ?? []).map((id) => (
            <a
              key={id}
              href={exampleHref("templates", id)}
              className="landing-card landing-card--flush landing-card--link"
            >
              <ShowcasePreview
                className="landing-live"
                content={getShowcase(id, lang)}
                ratio="16 / 9"
                pageWidth={760}
                dark={theme === "dark"}
                label={showcaseTitle(id, lang)}
              />
              <span className="landing-card__body">
                <span className="landing-card__title">{showcaseTitle(id, lang)}</span>
                <span className="landing-muted">{c.tryMeta[id]}</span>
                <span className="landing-text-link">
                  {c.templatesUse} <ArrowRight size={14} />
                </span>
              </span>
            </a>
          ))}
        </div>
      );
    case "databases":
      return (
        <div className="landing-stack">
          <div className="landing-chips" role="list">
            {c.views.map((v) => (
              <span key={v} role="listitem" className="landing-chip">
                {v}
              </span>
            ))}
          </div>
          <ShowcasePreview
            className="landing-live landing-frame"
            content={snippets.db[lang]}
            ratio="16 / 7"
            pageWidth={900}
            dark={theme === "dark"}
            label={c.sections.databases.heading}
          />
        </div>
      );
    case "offline":
      return (
        <div className="landing-steps">
          {c.offlineSteps.map((st) => (
            <div key={st.pill} className="landing-step">
              <span className={`landing-pill landing-pill--${st.tone}`}>{st.pill}</span>
              <span>{st.text}</span>
            </div>
          ))}
        </div>
      );
  }
}

// ── The live editor (the real one, nothing saved) ─────────────────────────
function LiveEditor({
  c,
  lang,
  theme,
  examples,
}: {
  c: LandingCopy;
  lang: LandingLang;
  theme: LandingTheme;
  examples: ShowcaseId[];
}) {
  const [current, setCurrent] = useState<ShowcaseId>(examples[0]);
  const [resetToken, setResetToken] = useState(0);
  const content = useMemo(() => getShowcase(current, lang), [current, lang]);
  return (
    <section className={`landing-editor${theme === "dark" ? " dark" : ""}`}>
      <div className="landing-editor__bar">
        <span className="landing-editor__badge">
          <span className="landing-editor__dot" />
          {c.editor.badge}
        </span>
        <span className="landing-editor__hint">{c.editor.hint}</span>
        <span className="landing-editor__spacer" />
        {examples.length > 1 && (
          <div className="landing-editor__examples" role="group" aria-label={c.editor.examples}>
            {examples.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={current === e}
                className={current === e ? "is-active" : undefined}
                onClick={() => setCurrent(e)}
              >
                {showcaseTitle(e, lang).split(" — ")[0]}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="landing-editor__reset"
          onClick={() => setResetToken((n) => n + 1)}
        >
          {c.editor.reset}
        </button>
      </div>
      <div className="landing-editor__page">
        <ShowcaseViewer content={content} editable resetToken={resetToken} />
      </div>
    </section>
  );
}

// ── "Try it yourself" ─────────────────────────────────────────────────────
function TryLinks({
  c,
  lang,
  section,
}: {
  c: LandingCopy;
  lang: LandingLang;
  section: SectionId;
}) {
  const tries = TOUR.tries[section];
  if (!tries?.length) return null;
  return (
    <section className="landing-try" aria-label={c.tryTitle}>
      <h2 className="landing-eyebrow">{c.tryTitle}</h2>
      <div className="landing-grid landing-grid--3">
        {tries.map((e) => (
          <a key={e} href={exampleHref(section, e)} className="landing-try__card">
            <span className="landing-card__icon">
              <FileText size={18} />
            </span>
            <span className="landing-try__text">
              <span className="landing-try__title">{showcaseTitle(e, lang)}</span>
              <span className="landing-muted landing-try__meta">{c.tryMeta[e]}</span>
            </span>
            <ArrowRight size={16} className="landing-try__arrow" />
          </a>
        ))}
      </div>
    </section>
  );
}

function NextLink({ c, section }: { c: LandingCopy; section: SectionId }) {
  const order = TOUR.groups.flatMap((g) => g.sections);
  const next = order[order.indexOf(section as Exclude<SectionId, "overview">) + 1];
  if (!next) return null;
  return (
    <a href={sectionHref(next)} className="landing-next">
      <span className="landing-muted">{c.sections[next].blurb}</span>
      <span className="landing-next__title">
        {c.sections[next].label} <ArrowRight size={16} />
      </span>
    </a>
  );
}

// ── An example, opened in the tour ────────────────────────────────────────
function ExampleView({
  c,
  lang,
  route,
  theme,
  onGetStarted,
}: {
  c: LandingCopy;
  lang: LandingLang;
  route: Route & { example: ShowcaseId };
  theme: LandingTheme;
  onGetStarted: () => void;
}) {
  const [resetToken, setResetToken] = useState(0);
  const content = useMemo(() => getShowcase(route.example, lang), [route.example, lang]);
  const reset = useCallback(() => setResetToken((n) => n + 1), []);
  return (
    <div className="landing-example">
      <div className="landing-example__banner" role="note">
        <span className="landing-example__badge">{c.example.badge}</span>
        <span className="landing-example__text">{c.example.banner}</span>
        <span className="landing-example__spacer" />
        <button type="button" className="landing-link-btn" onClick={reset}>
          {c.example.reset}
        </button>
        <button
          type="button"
          className="landing-btn landing-btn--primary landing-btn--sm"
          onClick={onGetStarted}
        >
          {c.example.useTemplate}
        </button>
      </div>
      <div className={`landing-example__page${theme === "dark" ? " dark" : ""}`}>
        <ShowcaseViewer content={content} editable resetToken={resetToken} />
      </div>
      <a href={sectionHref(route.section)} className="landing-next landing-next--back">
        <span className="landing-muted">{c.example.back}</span>
        <span className="landing-next__title">{c.sections[route.section].label}</span>
      </a>
    </div>
  );
}

// ── Screenshot slot ───────────────────────────────────────────────────────
function Shot({ id, label, ratio }: { id: ShotId; label: string; ratio: string }): ReactNode {
  const src = LANDING_SHOTS[id];
  return (
    <div className="landing-shot landing-frame" style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt={label.replace(/^[^—]*—\s*/, "")} loading="lazy" />
      ) : (
        <span className="landing-shot__label">{label}</span>
      )}
    </div>
  );
}
