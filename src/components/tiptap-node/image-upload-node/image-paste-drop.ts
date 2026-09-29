import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { UploadFunction } from "./image-upload-node-extension";

// Paste or drop image files straight into the page. Each image shows at once
// from a local preview, uploads in the background, then switches to its
// uploaded URL. A failed upload removes the image and reports the error.

interface PasteDropOptions {
  editor: Editor;
  upload: UploadFunction;
  maxSize: number;
  limit: number;
  onError?: (error: Error) => void;
}

export const imagePasteDropKey = new PluginKey("imagePasteDrop");

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
}

// Paste or drop on a node view's own UI (the upload card, a file block) is
// that node's business. Its editable content (a callout's text, a column)
// is still ours.
function fromNodeView(event: Event): boolean {
  const target = event.target as Element | null;
  // React node views mark their editable content as a wrapper too, so leave
  // those out when looking for the node view's own UI.
  const wrapper = target?.closest?.(
    "[data-node-view-wrapper]:not([data-node-view-content-react])",
  );
  if (!wrapper) return false;
  const content = target?.closest?.(
    "[data-node-view-content], [data-node-view-content-react]",
  );
  return !(content && wrapper.contains(content));
}

function uploadInto(
  view: EditorView,
  options: PasteDropOptions,
  files: File[],
  pos?: number,
) {
  const { editor, upload, maxSize, limit, onError } = options;

  const accepted = files.slice(0, limit).filter((file) => {
    if (maxSize > 0 && file.size > maxSize) {
      onError?.(
        new Error(
          `${file.name} is larger than ${Math.round(maxSize / 1024 / 1024)} MB`,
        ),
      );
      return false;
    }
    return true;
  });
  if (accepted.length === 0) return false;

  const previews = accepted.map((file) => ({
    file,
    preview: URL.createObjectURL(file),
  }));

  const nodes = previews.map(({ preview }) => ({
    type: "image",
    attrs: { src: preview, alt: "" },
  }));

  const chain = editor.chain().focus();
  if (typeof pos === "number") chain.insertContentAt(pos, nodes);
  else chain.insertContent(nodes);
  chain.run();

  for (const { file, preview } of previews) {
    upload(file)
      .then((url) => {
        replaceSrc(view, preview, url);
        URL.revokeObjectURL(preview);
      })
      .catch((error: unknown) => {
        removeBySrc(view, preview);
        URL.revokeObjectURL(preview);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      });
  }
  return true;
}

function replaceSrc(view: EditorView, from: string, to: string) {
  if (view.isDestroyed) return;
  const { state } = view;
  const tr = state.tr;
  state.doc.descendants((node, pos) => {
    if (node.type.name === "image" && node.attrs.src === from) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: to });
    }
  });
  if (tr.docChanged) view.dispatch(tr);
}

function removeBySrc(view: EditorView, src: string) {
  if (view.isDestroyed) return;
  const { state } = view;
  const ranges: { from: number; to: number }[] = [];
  state.doc.descendants((node, pos) => {
    if (node.type.name === "image" && node.attrs.src === src) {
      ranges.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  if (ranges.length === 0) return;
  const tr = state.tr;
  // Back to front so earlier positions stay valid.
  for (const range of ranges.reverse()) tr.delete(range.from, range.to);
  view.dispatch(tr);
}

export function imagePasteDropPlugin(options: PasteDropOptions) {
  return new Plugin({
    key: imagePasteDropKey,
    props: {
      handlePaste(view, event) {
        if (fromNodeView(event)) return false;
        const data = event.clipboardData;
        const files = imageFiles(data?.files);
        if (files.length === 0) return false;
        // Office apps and web pages put a picture of the copied text on the
        // clipboard too; when there's text, paste the text.
        if (data?.getData("text/plain")) return false;
        return uploadInto(view, options, files);
      },

      handleDrop(view, event, _slice, moved) {
        if (moved || fromNodeView(event)) return false;
        const files = imageFiles(event.dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        const at = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        return uploadInto(view, options, files, at?.pos);
      },
    },
  });
}
