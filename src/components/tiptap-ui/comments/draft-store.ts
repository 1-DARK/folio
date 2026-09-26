import { useSyncExternalStore } from "react";
import type { ID } from "src/types";

// The inline comment being written right now. It lives only here — nothing
// is saved until the first comment is posted, so cancelling leaves no empty
// thread behind. The editor shows its highlight through the thread sync
// (it's merged in as a local "drafted" thread).
export interface CommentDraft {
  threadId: ID;
  pageId: ID;
  from: number;
  to: number;
  /** When the draft started — the popover shows the more recent of this and
   *  the last clicked thread. */
  createdAt: number;
}

let draft: CommentDraft | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setCommentDraft(next: CommentDraft) {
  draft = next;
  emit();
}

export function clearCommentDraft() {
  if (!draft) return;
  draft = null;
  emit();
}

export function getCommentDraft(): CommentDraft | null {
  return draft;
}

export function useCommentDraft(): CommentDraft | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => draft,
    () => draft,
  );
}
