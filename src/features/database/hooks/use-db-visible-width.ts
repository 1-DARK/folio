import { useCallback } from "react";

/**
 * Callback ref for an element inside a database (`.db-node`). Keeps
 * `--db-visible-width` on the `.db-node` set to the width of its visible area
 * (its content box), so parts that stay put while the table scrolls sideways
 * (`.db-sticky-left`: the title bar, the toolbar) are never wider than what
 * you can see. Writes a CSS variable, no React state.
 */
export function useDbVisibleWidth() {
  return useCallback((el: HTMLElement | null) => {
    const node = el?.closest<HTMLElement>(".db-node");
    if (!node) return;

    const update = () => {
      const cs = getComputedStyle(node);
      const width =
        node.clientWidth -
        parseFloat(cs.paddingLeft || "0") -
        parseFloat(cs.paddingRight || "0");
      node.style.setProperty("--db-visible-width", `${Math.max(0, width)}px`);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
}