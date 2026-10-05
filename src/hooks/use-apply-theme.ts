import { useEffect } from "react";
import type { Theme } from "src/types";

// Kept for any lingering importers, but theme is no longer stored per-person
// in localStorage — it's per-workspace (workspace.settings.defaultTheme).
export const THEME_KEY = "folio-theme";

/** Resolve a Theme to a concrete dark boolean, honoring "system". */
function resolveDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Applies a theme to the document. Theme is per-workspace now: the caller
 * passes the current workspace's defaultTheme, and this re-applies whenever
 * that changes (on switch). Listens for OS changes only when the theme is
 * "system".
 */
export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const apply = () =>
      document.documentElement.classList.toggle("dark", resolveDark(theme));
    apply();
    // index.html reads this before the app loads, so the first paint (and
    // the loading spinner) already match the workspace theme.
    try {
      localStorage.setItem(THEME_KEY, theme === "system" ? "" : theme);
    } catch {
      /* storage blocked */
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);
}
