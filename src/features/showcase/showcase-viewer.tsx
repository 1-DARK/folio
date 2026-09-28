import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import {
  SHOWCASE_EXTENSIONS,
  makeEditableShowcaseExtensions,
} from "./showcase-extensions";
// The page editor's global node styles (the shell imports them too; listed
// here so a showcase renders correctly even where the shell isn't loaded).
import "src/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "src/components/tiptap-node/code-block-node/code-block-node.scss";
import "src/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "src/components/tiptap-node/list-node/list-node.scss";
import "src/components/tiptap-node/image-node/image-node.scss";
import "src/components/tiptap-node/heading-node/heading-node.scss";
import "src/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "src/features/shell/simple-editor.scss";
import "./showcase-viewer.scss";

// A Folio page rendered with the real editor nodes and styles. Works
// anywhere — inside the app or on the signed-out landing page — since it
// needs no providers: no collaboration, no Supabase, no active page.
// Read-only by default; `editable` turns it into a live editor with the
// slash menu (the landing's "try it"), whose changes are never saved.
export function ShowcaseViewer({
  content,
  className,
  compact = false,
  editable = false,
  resetToken = 0,
}: {
  content: JSONContent;
  className?: string;
  /** Smaller type and spacing, for previews inside cards and frames. */
  compact?: boolean;
  /** Let people type in it (changes stay in the page, never saved). */
  editable?: boolean;
  /** Change it to throw away edits and show `content` again. */
  resetToken?: number;
}) {
  const extensions = useMemo(
    () => (editable ? makeEditableShowcaseExtensions() : SHOWCASE_EXTENSIONS),
    [editable],
  );
  const editor = useEditor(
    {
      extensions,
      content,
      editable,
      // The editable one is created after mount: its React node views would
      // otherwise flushSync during render.
      immediatelyRender: !editable,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: editable
          ? { class: "simple-editor showcase-viewer__doc", spellcheck: "false" }
          : { class: "simple-editor showcase-viewer__doc", "aria-readonly": "true" },
      },
    },
    [extensions],
  );

  // Another page, a language switch or a reset: swap the document in place.
  // Skipped when nothing changed since the editor was made with `content`
  // (re-setting it on mount makes React node views flushSync mid-render).
  const shown = useRef({ editor, content, resetToken });
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const prev = shown.current;
    shown.current = { editor, content, resetToken };
    if (
      prev.editor === editor &&
      prev.content === content &&
      prev.resetToken === resetToken
    )
      return;
    // Deferred out of React's commit phase for the same reason.
    queueMicrotask(() => {
      if (!editor.isDestroyed) editor.commands.setContent(content, { emitUpdate: false });
    });
  }, [editor, content, resetToken]);

  return (
    <EditorContent
      editor={editor}
      className={`simple-editor-content showcase-viewer${compact ? " showcase-viewer--compact" : ""}${editable ? " showcase-viewer--editable" : ""}${className ? ` ${className}` : ""}`}
    />
  );
}
