import { useEffect, useMemo } from "react";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { ID, Thread } from "src/types";
import { useThreadsByPage } from "src/hooks/use-threads";
import { commentThreadPluginKey } from "../extensions/comment-thread-extension";
import {
  clearCommentDraft,
  setCommentDraft,
  useCommentDraft,
} from "../draft-store";

// Keeps the comment plugin's thread list in sync with the page's threads, so
// the editor draws the highlights. Only open inline threads are highlighted
// (resolved ones disappear, like Notion); the local draft is merged in so its
// text stays highlighted while you write the first comment.
//
// Also turns the comment button's "draftThread" transaction into a LOCAL
// draft — nothing is saved until the first comment is posted.
//
// Mount once, always (it replaces the sync the old sidebar did).
export function useSyncThreadsToEditor(
  editor: Editor | null,
  pageId: ID | null,
) {
  const { data: threadsData } = useThreadsByPage(pageId);
  const draft = useCommentDraft();

  const threads = useMemo<Thread[]>(() => {
    const open = (threadsData ?? []).filter(
      (t) =>
        t.anchor != null &&
        t.status !== "resolved" &&
        t.status !== "deleted" &&
        t.status !== "drafted",
    );
    if (draft && draft.pageId === pageId) {
      open.push({
        id: draft.threadId,
        pageId: draft.pageId,
        anchor: { from: draft.from, to: draft.to },
        status: "drafted",
      });
    }
    return open;
  }, [threadsData, draft, pageId]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.view.state.tr.setMeta(commentThreadPluginKey, {
        type: "setThreads",
        threads,
      }),
    );
    // Force a decoration rebuild after the state settles — a fresh editor's
    // decoration plugin otherwise stays empty until an unrelated transaction.
    const raf = requestAnimationFrame(() => {
      if (editor.isDestroyed) return;
      editor.view.dispatch(
        editor.view.state.tr.setMeta(commentThreadPluginKey, {
          type: "scroll",
        }),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [editor, threads]);

  // A draft doesn't follow you to another page (the draft store is external,
  // so clearing it here is an external-system update, not React state).
  useEffect(() => {
    clearCommentDraft();
  }, [pageId]);

  // The comment button dispatches { type: "draftThread", from, to, threadId }.
  useEffect(() => {
    if (!editor || !pageId) return;
    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      const meta = transaction.getMeta(commentThreadPluginKey) as
        | { type?: string; from?: number; to?: number; threadId?: string }
        | undefined;
      if (
        meta?.type === "draftThread" &&
        meta.threadId &&
        meta.from != null &&
        meta.to != null &&
        meta.to > meta.from
      ) {
        setCommentDraft({
          threadId: meta.threadId,
          pageId,
          from: meta.from,
          to: meta.to,
          createdAt: Date.now(),
        });
      }
    };
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("transaction", onTransaction);
    };
  }, [editor, pageId]);
}
