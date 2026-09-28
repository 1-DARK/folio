import { useEffect } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { SHOWCASE_EXTENSIONS } from "./showcase-extensions";
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

// A read-only Folio page, rendered with the real editor nodes and styles.
// Works anywhere — inside the app or on the signed-out landing page — since
// it needs no providers: no collaboration, no Supabase, no active page.
export function ShowcaseViewer({
  content,
  className,
  compact = false,
}: {
  content: JSONContent;
  className?: string;
  /** Smaller type and spacing, for previews inside cards and frames. */
  compact?: boolean;
}) {
  const editor = useEditor({
    extensions: SHOWCASE_EXTENSIONS,
    content,
    editable: false,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: "simple-editor showcase-viewer__doc",
        "aria-readonly": "true",
      },
    },
  });

  // Language switch (or another page): swap the document in place.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, content]);

  return (
    <EditorContent
      editor={editor}
      className={`simple-editor-content showcase-viewer${compact ? " showcase-viewer--compact" : ""}${className ? ` ${className}` : ""}`}
    />
  );
}
