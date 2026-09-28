import { useCallback } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import type { ID } from "src/types";
import { useCurrentPerson } from "src/hooks/use-session";
import { extractMentionIds } from "src/utils/extract-mention-ids";
import { useActivePageState } from "src/features/pages/context/active-page-context";
import { useNotificationActions } from "../inbox/notification/notification-context";
import { commentThreadPluginKey } from "./extensions";

// The commented text, read from the document. Uses the live (remapped) anchor
// from the plugin when the thread is highlighted, otherwise the fallback
// (e.g. a resolved thread's stored anchor).
export function anchorText(
  editor: Editor | null,
  threadId: ID,
  fallback?: { from: number; to: number } | null,
): string {
  if (!editor || editor.isDestroyed) return "";
  const state = commentThreadPluginKey.getState(editor.state);
  const anchor =
    state?.threads.find((t) => t.id === threadId)?.anchor ?? fallback;
  if (!anchor) return "";
  const size = editor.state.doc.content.size;
  const from = Math.max(0, Math.min(anchor.from, size));
  const to = Math.max(from, Math.min(anchor.to, size));
  return editor.state.doc.textBetween(from, to, " ").trim();
}

// Mention notifications for a posted comment (not for yourself).
export function useNotifyMentions() {
  const { person } = useCurrentPerson();
  const { activePageId, activePage } = useActivePageState();
  const { addNotification } = useNotificationActions();
  return useCallback(
    (json: JSONContent, commentId: ID, threadId: ID) => {
      if (!person) return;
      for (const personId of extractMentionIds(json)) {
        if (personId === person.id) continue;
        addNotification({
          type: "comment-mention",
          title: "Mentioned in a comment",
          message: `${person.name} mentioned you in a comment.`,
          recipientId: personId,
          dedupKey: `comment-mention:${commentId}:${personId}`,
          sourcePageId: activePageId ?? undefined,
          sourcePageTitle: activePage?.title,
          targetNodeId: threadId,
        });
      }
    },
    [person, activePageId, activePage?.title, addNotification],
  );
}
