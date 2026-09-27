import { useEffect, useMemo, useRef } from "react";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { ID, Thread } from "src/types";
import { useThreadsByPage } from "src/hooks/use-threads";
import { useEditorSync } from "src/components/tiptap-templates/simple/context/editor-sync-context";
import {
  commentThreadPluginKey,
  setSyncedThreads,
} from "../extensions/comment-thread-extension";
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
  const { isSyncing } = useEditorSync();

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

  const threadsRef = useRef(threads);
  useEffect(() => {
    threadsRef.current = threads;
    // Also seeds the plugin: any fresh editor state starts from this list.
    setSyncedThreads(threads);
  }, [threads]);

  // Send the threads now, and again on the next frame: the editor view is
  // (re)mounted when the page sync ends (the skeleton is swapped for the
  // editor), which can reset the plugin state without any transaction — that
  // is why the highlights only appeared after clicking the comment button
  // (the draft forced a re-send). Re-running on isSyncing covers that swap.
  useEffect(() => {
    if (!editor || editor.isDestroyed || isSyncing) return;
    const send = () => {
      if (editor.isDestroyed) return;
      editor.view.dispatch(
        editor.view.state.tr.setMeta(commentThreadPluginKey, {
          type: "setThreads",
          threads,
        }),
      );
    };
    send();
    const raf = requestAnimationFrame(send);
    return () => cancelAnimationFrame(raf);
  }, [editor, threads, isSyncing]);

  // Re-send after document changes. The page content often arrives AFTER the
  // threads (collab sync, or the shared editor still showing the previous
  // page); that wholesale replacement maps every anchor down to ~0 and the
  // highlights vanish. The plugin's setThreads keeps live anchors and only
  // recovers the saved range for ones that collapsed, so re-sending is safe.
  // Debounced so typing doesn't dispatch on every keystroke.
  useEffect(() => {
    if (!editor) return;
    let timer: number | null = null;
    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      if (!transaction.docChanged) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        if (editor.isDestroyed) return;
        editor.view.dispatch(
          editor.view.state.tr.setMeta(commentThreadPluginKey, {
            type: "setThreads",
            threads: threadsRef.current,
          }),
        );
      }, 120);
    };
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("transaction", onTransaction);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [editor]);

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
