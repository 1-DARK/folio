import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AudioNodeView } from "./audio-node-view";
import type { MediaUploadOptions } from "src/components/tiptap-node/media-upload-card";

/** Upload function, size limit and error callback (same as the video block). */
export type AudioOptions = MediaUploadOptions;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      insertAudio: (attrs?: {
        src?: string;
        fileName?: string;
        caption?: string;
      }) => ReturnType;
    };
  }
}

export const AudioExtension = Node.create<AudioOptions>({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      upload: undefined,
      maxSize: 25 * 1024 * 1024,
      onError: undefined,
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: null },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "audio" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },

  addCommands() {
    return {
      insertAudio:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: "audio",
            attrs: {
              src: attrs.src ?? null,
              fileName: attrs.fileName ?? null,
              caption: attrs.caption ?? "",
            },
          }),
    };
  },
});
