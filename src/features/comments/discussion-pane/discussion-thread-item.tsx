import type { MouseEvent } from "react";
import type { Editor } from "@tiptap/core";
import { useTranslation } from "react-i18next";
import type { Thread } from "src/types";
import { useCommentsByThread } from "src/hooks/use-comments";
import { usePersonNames } from "src/hooks/use-person-names";
import { CommentCard } from "../components/comment-card";
import { ThreadConversation } from "../components/thread-conversation";
import { anchorText } from "../utils";

// Clicks on these never select / expand the card (they do their own thing).
const INTERACTIVE =
  "button, a, input, textarea, [contenteditable='true'], [data-radix-popper-content-wrapper]";

// A thread in the discussion pane. Collapsed: a preview (quote, first
// comment, reply count). Expanded: the exact same conversation as the inline
// comment popover — reactions, resolve, edit / delete, reply.
// Clicking the card selects it (the pane scrolls the page to its text).
export function DiscussionThreadItem({
  thread,
  editor,
  expanded,
  onSelect,
  onCollapse,
}: {
  thread: Thread;
  editor: Editor | null;
  expanded: boolean;
  onSelect: () => void;
  onCollapse: () => void;
}) {
  const { data: comments = [] } = useCommentsByThread(thread.id);
  const first = comments[0];
  if (!first) return null;

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Portaled menus (reaction picker, "more") bubble here through React —
    // ignore anything outside the card's own DOM, and its controls.
    if (!e.currentTarget.contains(target)) return;
    if (target.closest(INTERACTIVE)) return;
    onSelect();
  };

  return (
    <div
      className={`discussion-item${expanded ? " is-expanded" : ""}${
        thread.status === "resolved" ? " is-resolved" : ""
      }`}
      onClick={handleClick}
    >
      {expanded ? (
        <ThreadConversation
          editor={editor}
          thread={thread}
          onClose={onCollapse}
        />
      ) : (
        <ThreadPreview
          editor={editor}
          thread={thread}
          first={first}
          replyCount={comments.length - 1}
        />
      )}
    </div>
  );
}

function ThreadPreview({
  editor,
  thread,
  first,
  replyCount,
}: {
  editor: Editor | null;
  thread: Thread;
  first: { personId: string; body: string; createdAt: number };
  replyCount: number;
}) {
  const { t } = useTranslation();
  const resolveName = usePersonNames();
  const quote = anchorText(editor, thread.id, thread.anchor);

  return (
    <div className="ctp">
      <CommentCard
        name={resolveName(first.personId)}
        content={first.body}
        createdAt={first.createdAt}
        authorId={first.personId}
        quote={thread.suggestion ? undefined : quote || undefined}
        suggestion={thread.suggestion ?? undefined}
        deleted={false}
        onEdit={() => {}}
        onDelete={() => {}}
        showActions={false}
      />
      {replyCount > 0 && (
        <span className="discussion-item__count">
          {replyCount === 1
            ? t("comments.oneReply", "1 reply")
            : t("comments.replyCount", "{{count}} replies", {
                count: replyCount,
              })}
        </span>
      )}
    </div>
  );
}
