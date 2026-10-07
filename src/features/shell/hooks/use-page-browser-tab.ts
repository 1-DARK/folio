import { useEffect, useState } from "react";
import { dynamicIconImports } from "lucide-react/dynamic";
import { useBrowserTab, type BrowserTabIcon } from "./use-browser-tab";
import { useActivePageState } from "../../pages/context/active-page-context";
import { resolveIconName } from "../../pages/cover/icon-name";

function resolveColor(raw: string | null): string {
  const FALLBACK = "#5b5b5b";
  if (!raw) return FALLBACK;

  // Concrete color already (hex/rgb/hsl) — use as-is.
  if (!raw.startsWith("var(")) return raw;

  // CSS var → resolve to a real value via the computed style.
  // Extract the custom-property name from `var(--x, fallback)`.
  const propName = raw
    .slice(4, raw.indexOf(",") === -1 ? raw.lastIndexOf(")") : raw.indexOf(","))
    .trim();
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(propName)
    .trim();
  return resolved || FALLBACK;
}

type IconNode = [tag: string, attrs: Record<string, string>][];

const escapeAttr = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Page icons are Lucide icons (see DynamicIcon). Load the same icon's shapes
// and turn them into an SVG data-URL, so the tab shows exactly the icon the
// page shows — for every icon, not only the few names an icon font knows.
async function lucideIconToFaviconHref(
  name: string,
  color: string,
): Promise<string | null> {
  const key = resolveIconName(name) as keyof typeof dynamicIconImports;
  const load = dynamicIconImports[key];
  if (!load) return null;

  let node: IconNode | undefined;
  try {
    node = ((await load()) as { __iconNode?: IconNode }).__iconNode;
  } catch {
    return null;
  }
  if (!node?.length) return null;

  const children = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${escapeAttr(color)}" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Mount once, high in the tree (the page view that wraps the editor), so it
 * re-runs when the active page changes. Drives the browser tab title + favicon,
 * branching on cover.target exactly like PageItemIcon.
 *
 * With `providedTitle` (a view that isn't a page: inbox, trash, chat…) the tab
 * shows that title and the default Folio icon.
 */
export function usePageBrowserTab(
  appName: string | null = "Folio",
  providedTitle?: string,
) {
  const { activePage } = useActivePageState();
  const isPage = providedTitle === undefined;
  const cover = isPage ? activePage?.cover : undefined;
  const title = providedTitle ?? activePage?.title;

  const target = cover?.target ?? null;
  const iconName = cover?.iconName ?? null;
  const color = cover?.color ?? null;

  // Only the "Icons" case is async; we store the resolved favicon keyed by the
  // icon name and colour so a stale result is ignored once the page changes.
  // setState happens ONLY inside the async callback — never synchronously in
  // the effect.
  const [resolved, setResolved] = useState<{
    key: string;
    href: string;
  } | null>(null);
  const iconKey = `${iconName ?? ""}|${color ?? ""}`;

  useEffect(() => {
    if (target !== "Icons" || !iconName) return;

    const resolvedColor = resolveColor(color);

    let cancelled = false;
    lucideIconToFaviconHref(iconName, resolvedColor).then((href) => {
      if (!cancelled && href) setResolved({ key: iconKey, href });
    });
    return () => {
      cancelled = true;
    };
  }, [target, iconName, color, iconKey]);

  // Derived synchronously — no setState needed for emoji / empty cases.
  let icon: BrowserTabIcon = null;
  if (iconName) {
    if (target === "Emoji") {
      icon = { kind: "emoji", value: iconName };
    } else if (target === "Icons" && resolved?.key === iconKey) {
      icon = { kind: "href", value: resolved.href };
    }
  }

  useBrowserTab(title, icon, { appName });
}
