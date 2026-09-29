"use client";

import { useCallback } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { focusNextNode, isValidPosition } from "src/lib/tiptap-utils";
import { ImageUploadCard, type InsertedImage } from "./image-upload-card";

// The empty image block: shows the upload card, then replaces itself with
// the images that were uploaded, linked or picked.
export const ImageUploadNodeView: React.FC<NodeViewProps> = (props) => {
  const { accept, limit, maxSize } = props.node.attrs;
  const { editor, getPos, node, extension } = props;

  const insertImages = useCallback(
    (images: InsertedImage[]) => {
      const pos = getPos();
      if (!isValidPosition(pos)) return;

      const replaceAttrs = node.attrs._replaceAttrs ?? {};

      const imageNodes = images.map((image) => ({
        type: "image",
        attrs: {
          ...replaceAttrs,
          src: image.src,
          alt: replaceAttrs.alt ?? image.alt ?? "",
          ...(image.caption
            ? { caption: image.caption, showCaption: true }
            : {}),
        },
      }));

      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .insertContentAt(pos, imageNodes)
        .run();

      focusNextNode(editor);
    },
    [editor, getPos, node],
  );

  return (
    <NodeViewWrapper>
      <ImageUploadCard
        accept={accept}
        limit={limit}
        maxSize={maxSize}
        upload={extension.options.upload}
        onError={extension.options.onError}
        onInsert={insertImages}
      />
    </NodeViewWrapper>
  );
};
