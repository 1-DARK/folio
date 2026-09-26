import { useState, useEffect, useRef } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import { useThreadsByPage } from "src/hooks/use-threads";
import { useCommentsByThread } from "src/hooks/use-comments";
import { useDeleteComment } from "src/hooks/use-delete-comment";
import { usePatchComment } from "src/hooks/use-patch-comment";
import { patchComment } from "src/api/comments";
import { useCreateThread } from "src/hooks/use-create-thread";
import { useCreateComment } from "src/hooks/use-create-comment";
import { usePatchThread } from "src/hooks/use-patch-thread";
import { patchThread } from "src/api/threads";
import { useCurrentPerson } from "src/hooks/use-session";
import { usePersonNames } from "src/hooks/use-person-names";
import { makeThread } from "src/utils/make-thread";
import { makeComment } from "src/utils/make-comment";
import { Avatar } from "src/components/tiptap-ui-primitive/avatar";
import { CommentCard } from "src/components/tiptap-ui/comments/components/comment-card";
import {
  CommentMentionEditor,
  type CommentEditorRef,
} from "src/components/tiptap-ui/comments/editor";
import { useActivePageState } from "src/components/tiptap-templates/simple/context/active-page-context";
import type { Thread } from "src/types";
import "./page-comment-view.scss";

// Page-level comments (Notion style). Renders NOTHING until there's either an
// existing page comment or the user explicitly opens the composer (via the
// page-top "Comment" button, which fires a "folio:open-page-comment" event).
// No empty thread is ever created — a thread is born only on submit.
export function PageCommentView({ node }: NodeViewProps) {
  const { t } = useTranslation();
  const pageId = node.attrs.pageId as string;
  const { data: threads = [] } = useThreadsByPage(pageId);
  const [showResolved, setShowResolved] = useState(false);

  const pageThreads = threads.filter(
    (th) =>
      th.anchor === null && th.status !== "deleted" && th.status !== "drafted",
  );
  const openThreads = pageThreads.filter((th) => th.status !== "resolved");
  const resolvedThreads = pageThreads.filter((th) => th.status === "resolved");

  // The composer is hidden until the user asks for it. It's revealed by the
  // page-top Comment button dispatching this event (see FloatingActions).
  const [composerOpen, setComposerOpen] = useState(false);
  useEffect(() => {
    const open = () => setComposerOpen(true);
    document.addEventListener("folio:open-page-comment", open);
    return () => document.removeEventListener("folio:open-page-comment", open);
  }, []);

  // Nothing to show → render nothing at all (the wrapper stays mounted so the
  // event listener stays alive, but takes no visual space).
  const showAnything = pageThreads.length > 0 || composerOpen;

  return (
    <NodeViewWrapper
      className={`page-comment${showAnything ? "" : " is-empty"}`}
      contentEditable={false}
      data-type="page-comment"
    >
      {openThreads.length > 0 && (
        <div className="page-comment__threads">
          {openThreads.map((thread) => (
            <PageThread key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {composerOpen && (
        <PageCommentComposer
          pageId={pageId}
          onDone={() => setComposerOpen(false)}
        />
      )}

      {resolvedThreads.length > 0 && (
        <>
          <button
            type="button"
            className="page-comment__resolved-toggle"
            onClick={() => setShowResolved((v) => !v)}
          >
            {showResolved
              ? t("comments.hideResolved", "Hide resolved comments")
              : t("comments.showResolved", {
                  count: resolvedThreads.length,
                  defaultValue: "{{count}} resolved comments",
                })}
          </button>
          {showResolved && (
            <div className="page-comment__threads is-resolved">
              {resolvedThreads.map((thread) => (
                <PageThread key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </>
      )}
    </NodeViewWrapper>
  );
}

function PageThread({ thread }: { thread: Thread }) {
  const { data: comments = [] } = useCommentsByThread(thread.id);
  const { person } = useCurrentPerson();
  const { activePage } = useActivePageState();
  const resolveName = usePersonNames();

  const deleteComment = useDeleteComment();
  const updateComment = usePatchComment(({ id, patch }) =>
    patchComment(id, patch),
  );
  const mutateThread = usePatchThread(({ id, patch }) =>
    patchThread(id, patch),
  );

  const resolved = thread.status === "resolved";
  const toggleResolved = () =>
    mutateThread.mutate({
      id: thread.id,
      patch: { status: resolved ? "open" : "resolved" },
    });

  // A thread with no comments shouldn't exist; guard so we never render an
  // orphaned reply box.
  if (comments.length === 0) return null;

  return (
    <div className={`page-comment__thread${resolved ? " is-resolved" : ""}`}>
      {comments.map((c, i) => (
        <CommentCard
          key={c.id}
          name={resolveName(c.personId)}
          content={c.body}
          createdAt={c.createdAt}
          deleted={false}
          reactions={c.reactions}
          authorId={c.personId}
          commentId={c.id}
          pageId={thread.pageId}
          pageTitle={activePage?.title}
          threadId={thread.id}
          onReact={(next) =>
            updateComment.mutate({ id: c.id, patch: { reactions: next } })
          }
          onEdit={(val) =>
            updateComment.mutate({ id: c.id, patch: { body: val } })
          }
          onDelete={() => deleteComment.mutate(c.id)}
          onResolve={i === 0 ? toggleResolved : undefined}
          resolved={resolved}
          showActions={c.personId === person?.id}
        />
      ))}
      {!resolved && <PageCommentReply threadId={thread.id} />}
    </div>
  );
}

// "Add a comment…" row at the bottom of every open thread (always visible,
// like Notion) — your avatar, the editor, and a send button once there's text.
function PageCommentReply({ threadId }: { threadId: string }) {
  const { t } = useTranslation();
  const { person } = useCurrentPerson();
  const createComment = useCreateComment();
  const editorRef = useRef<CommentEditorRef>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const submit = (json: JSONContent) => {
    if (!person) return;
    createComment.mutate({
      comment: makeComment({
        threadId,
        text: JSON.stringify(json),
        authorId: person.id,
      }),
      threadId,
    });
    setIsEmpty(true);
  };

  return (
    <div className="page-comment__reply">
      <Avatar
        size="sm"
        src={person?.avatarUrl ?? undefined}
        name={person?.name ?? ""}
      />
      <CommentMentionEditor
        ref={editorRef}
        placeholder={t("comments.addComment", "Add a comment…")}
        onSubmit={submit}
        onEmptyChange={setIsEmpty}
      />
      {!isEmpty && (
        <button
          type="button"
          className="page-comment__submit"
          aria-label={t("comments.send", "Send")}
          onClick={() => {
            editorRef.current?.submit();
            editorRef.current?.clear();
          }}
        >
          <ArrowUp size={15} />
        </button>
      )}
    </div>
  );
}

function PageCommentComposer({
  pageId,
  onDone,
}: {
  pageId: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { person } = useCurrentPerson();
  const createThread = useCreateThread();
  const createComment = useCreateComment();
  const editorRef = useRef<CommentEditorRef>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const submit = async (json: JSONContent) => {
    if (!person) return;
    // Thread born on submit, with its first comment — no empty threads.
    const thread = makeThread({ pageId, anchor: null, status: "open" });
    await createThread.mutateAsync(thread);
    createComment.mutate({
      comment: makeComment({
        threadId: thread.id,
        text: JSON.stringify(json),
        authorId: person.id,
      }),
      threadId: thread.id,
    });
    onDone();
  };

  return (
    <div className="page-comment__composer">
      <Avatar
        size="sm"
        src={person?.avatarUrl ?? undefined}
        name={person?.name ?? ""}
      />
      <CommentMentionEditor
        ref={editorRef}
        autoFocus
        placeholder={t("comments.addComment", "Add a comment…")}
        onSubmit={submit}
        onEmptyChange={setIsEmpty}
      />
      <button
        type="button"
        className="page-comment__submit"
        aria-label={t("comments.send", "Send")}
        disabled={isEmpty}
        onClick={() => editorRef.current?.submit()}
      >
        <ArrowUp size={15} />
      </button>
    </div>
  );
}
