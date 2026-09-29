import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VideoNodeView } from "./video-node-view";
import type { MediaUploadOptions } from "src/components/tiptap-node/media-upload-card";

// Upload function, size limit and error callback, shared with the audio block.
export type VideoOptions = MediaUploadOptions;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs?: {
        src?: string;
        fileName?: string;
        caption?: string;
        poster?: string;
      }) => ReturnType;
    };
  }
}

// One block for every video: an uploaded file, a direct link to one, or a
// YouTube, Vimeo or Loom link (played in their embed). See video-embed.ts.
export const VideoExtension = Node.create<VideoOptions>({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

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
      poster: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      insertVideo:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: "video",
            attrs: {
              src: attrs.src ?? null,
              fileName: attrs.fileName ?? null,
              caption: attrs.caption ?? "",
              poster: attrs.poster ?? null,
            },
          }),
    };
  },
});
