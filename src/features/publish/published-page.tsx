import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, FileText } from "lucide-react";
import type { PageCover } from "src/types";
import type { PublishedPageLink } from "src/api/pages";
import { usePublishedPage } from "src/hooks/use-publish-page";
import { ShowcaseViewer } from "src/features/showcase/showcase-viewer";
import { PageItemIcon } from "src/features/pages/page-item/page-item-icon";
import { DynamicIcon } from "src/features/pages/cover/dynamic-icon";
import { GateLoading } from "src/features/auth/auth-gate";
import { toPublishedDoc } from "./published-content";
import "./published-page.scss";

// /p/<page id>: a published page, for anyone with the link — signed in or
// not. Read-only, always the latest saved version. When the page is
// published with its subpages, they're listed at the bottom and links
// between them stay on /p/. Rendered outside the signed-in app (no
// sidebar, no providers), so it loads fast for visitors.

const idFromPath = (path: string) => {
  const m = path.match(/^\/p\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

function coverBackground(cover: PageCover | null | undefined): string | null {
  if (cover?.coverImage)
    return `center / cover no-repeat url(${cover.coverImage})`;
  if (cover?.gradient) return cover.gradient;
  if (cover?.color && cover.color.startsWith("#")) return cover.color;
  return null;
}

// Follow the visitor's system theme (there's no account to read it from).
function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle("dark", mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
}

// Published pages aren't meant for search engines (for now).
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

// The page's icon above the title, at page size (the shared icon component
// is sized for rows).
function BigIcon({ cover }: { cover: PageCover }) {
  if (!cover.iconName) return null;
  if (cover.target === "Emoji") {
    return (
      <span className="published__emoji" aria-hidden>
        {cover.iconName}
      </span>
    );
  }
  return (
    <DynamicIcon
      name={cover.iconName}
      size={64}
      style={{
        color:
          !cover.color || cover.color === "var(--tt-text-color)"
            ? "var(--tt-text-primary)"
            : cover.color,
      }}
    />
  );
}

export default function PublishedPage() {
  const { t } = useTranslation();
  const [id, setId] = useState(() => idFromPath(window.location.pathname));
  const { data, isLoading, isError } = usePublishedPage(id);
  useSystemTheme();
  useNoIndex();

  useEffect(() => {
    const onPop = () => setId(idFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((pageId: string) => {
    window.history.pushState(null, "", `/p/${encodeURIComponent(pageId)}`);
    setId(pageId);
    window.scrollTo(0, 0);
  }, []);

  const untitled = t("page.untitled", "Untitled");
  const title = data?.page.title || untitled;

  useEffect(() => {
    document.title = data ? `${title} · Folio` : "Folio";
  }, [data, title]);

  // Links to pages visitors can see stay on /p/; the rest are plain text.
  const visible = useMemo(() => {
    const ids = new Set<string>();
    if (data) {
      ids.add(data.page.id);
      data.trail.forEach((p) => ids.add(p.id));
      data.subpages.forEach((p) => ids.add(p.id));
    }
    return ids;
  }, [data]);

  const doc = useMemo(
    () =>
      data
        ? toPublishedDoc(data.page.content, {
            linkFor: (pageId) => (visible.has(pageId) ? `/p/${pageId}` : null),
            unavailableText: t(
              "publish.unavailableBlock",
              "This block isn't available on published pages.",
            ),
            fallbackTitle: title,
          })
        : null,
    [data, visible, t, title],
  );

  // Clicks on links to other published pages: navigate in place.
  const onClickCapture = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    const target = href ? idFromPath(href) : null;
    if (!target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    go(target);
  };

  if (!id || isError || (!isLoading && !data)) {
    return (
      <div className="published published--empty">
        <div className="published__missing">
          <FileText size={28} aria-hidden />
          <h1>{t("publish.notFoundTitle", "This page isn't published")}</h1>
          <p>
            {t(
              "publish.notFoundText",
              "It may have been unpublished, or the link is wrong.",
            )}
          </p>
          <a className="published__home" href="/">
            {t("publish.goToFolio", "Go to Folio")}
          </a>
        </div>
      </div>
    );
  }

  if (isLoading || !data || !doc) return <GateLoading />;

  const banner = coverBackground(data.page.cover);
  const full = data.page.settings?.width === "full";
  const crumbs: PublishedPageLink[] = data.trail;

  return (
    <div className="published" onClickCapture={onClickCapture}>
      <header className="published__bar">
        <nav
          className="published__crumbs"
          aria-label={t("publish.path", "Path")}
        >
          {crumbs.map((c) => (
            <span key={c.id} className="published__crumb-wrap">
              <a className="published__crumb" href={`/p/${c.id}`}>
                {c.cover && (
                  <PageItemIcon
                    cover={c.cover}
                    styles={{ width: 15, height: 15, fontSize: 15 }}
                  />
                )}
                <span>{c.title || untitled}</span>
              </a>
              <ChevronRight size={14} aria-hidden />
            </span>
          ))}
          <span className="published__crumb is-current" aria-current="page">
            {data.page.cover && (
              <PageItemIcon
                cover={data.page.cover}
                styles={{ width: 15, height: 15, fontSize: 15 }}
              />
            )}
            <span>{title}</span>
          </span>
        </nav>
        <a className="published__brand" href="/">
          {t("publish.madeWith", "Made with Folio")}
        </a>
      </header>

      {banner && (
        <div className="published__cover" style={{ background: banner }} />
      )}

      <main className={`published__main${full ? " is-full" : ""}`}>
        {data.page.cover?.iconName && (
          <div className={`published__icon${banner ? " on-cover" : ""}`}>
            <BigIcon cover={data.page.cover} />
          </div>
        )}

        <ShowcaseViewer key={data.page.id} content={doc} />

        {data.subpages.length > 0 && (
          <section className="published__subpages" aria-labelledby="pub-sub">
            <h2 id="pub-sub" className="published__subpages-title">
              {t("publish.subpages", "Pages")}
            </h2>
            <ul>
              {data.subpages.map((p) => (
                <li key={p.id}>
                  <a className="published__subpage" href={`/p/${p.id}`}>
                    {p.cover ? (
                      <PageItemIcon
                        cover={p.cover}
                        styles={{ width: 18, height: 18, fontSize: 18 }}
                      />
                    ) : (
                      <FileText size={18} aria-hidden />
                    )}
                    <span>{p.title || untitled}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
