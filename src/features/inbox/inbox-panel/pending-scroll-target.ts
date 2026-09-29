// A tiny module-level store for "after we navigate to a page, scroll to this
// node/thread." The inbox sets a target before navigating; the editor reads and
// clears it once the destination page's editor has mounted and rendered.
//
// Module-level (not context) because it must survive the route change and the
// editor remount that navigation triggers.

import type { FindOptions } from "src/lib/find-in-pages";

/** A find-in-pages match to scroll to: the query and the block it's in. */
export interface FindTarget {
  query: string;
  options: FindOptions;
  blockIndex: number;
}

export interface ScrollTarget {
  pageId: string;
  targetNodeId?: string; // a mention nodeId, thread id, or page-comment marker
  type?: string; // notification type, to pick the scroll strategy
  find?: FindTarget; // type "find": the match to scroll to
}

let pending: ScrollTarget | null = null;
const listeners = new Set<() => void>();

export function setPendingScrollTarget(t: ScrollTarget) {
  pending = t;
  listeners.forEach((l) => l());
}

export function consumePendingScrollTarget(
  pageId: string,
): ScrollTarget | null {
  if (pending && pending.pageId === pageId) {
    const t = pending;
    pending = null;
    return t;
  }
  return null;
}

export function subscribePendingScrollTarget(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
