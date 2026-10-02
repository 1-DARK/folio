import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  looksLikeMarkdown,
  markdownToContent,
} from "src/lib/markdown/markdown-to-content";

// Paste Markdown, get blocks: headings, lists, to-dos, quotes, code, tables.
//
// Only plain text is converted, and only when it reads like Markdown (see
// looksLikeMarkdown). Rich HTML — from a web page, a doc, or Folio itself —
// keeps the editor's normal paste. Inside a code block or the title, a
// paste stays plain text. Ctrl+Shift+V always pastes as plain text.

export const markdownPastePluginKey = new PluginKey("markdownPaste");

/** Block tags that mean the clipboard HTML already has structure. */
const STRUCTURED_HTML = /<(p|h[1-6]|li|ul|ol|table|blockquote|pre)[\s>]/i;

export const MarkdownPaste = Extension.create({
  name: "markdownPaste",

  addProseMirrorPlugins() {
    const editor = this.editor;
    let plainTextPaste = false;

    return [
      new Plugin({
        key: markdownPastePluginKey,
        props: {
          handleKeyDown(_view, event) {
            // Ctrl/Cmd+Shift+V: the user asked for plain text.
            plainTextPaste =
              (event.ctrlKey || event.metaKey) &&
              event.shiftKey &&
              event.key.toLowerCase() === "v";
            return false;
          },
          handlePaste(view, event) {
            const asPlain = plainTextPaste;
            plainTextPaste = false;
            if (asPlain || !editor.isEditable) return false;

            const data = event.clipboardData;
            const text = data?.getData("text/plain");
            if (!data || !text) return false;
            if (data.files.length) return false;

            const html = data.getData("text/html");
            if (html && STRUCTURED_HTML.test(html)) return false;

            const { $from } = view.state.selection;
            if ($from.parent.type.spec.code) return false;
            if ($from.parent.type.name === "title") return false;

            if (!looksLikeMarkdown(text)) return false;

            try {
              const content = markdownToContent(text, view.state.schema);
              if (!content.length) return false;
              const sizeBefore = view.state.doc.content.size;
              const replacedTo = view.state.selection.to;
              if (!editor.chain().focus().insertContent(content).run()) {
                return false;
              }
              // Leave the cursor right after what was pasted. (Left alone,
              // a paste ending on a rule, equation or image leaves a block
              // selected, and the next keystroke replaces it.)
              const { doc } = editor.state;
              const end = Math.min(
                doc.content.size,
                replacedTo + doc.content.size - sizeBefore,
              );
              const $end = doc.resolve(end);
              if ($end.parent.isTextblock) {
                editor.commands.setTextSelection(end);
              } else if (doc.nodeAt(end)?.isTextblock) {
                editor.commands.setTextSelection(end + 1);
              } else {
                editor
                  .chain()
                  .insertContentAt(end, { type: "paragraph" })
                  .setTextSelection(end + 1)
                  .run();
              }
              return true;
            } catch (error) {
              console.warn("Markdown paste failed, pasting as text", error);
              return false;
            }
          },
        },
      }),
    ];
  },
});
