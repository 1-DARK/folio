import type { Editor } from "@tiptap/core";
import { commentThreadPluginKey } from "../../../../../../components/tiptap-ui/comments/extensions/comment-thread-extension";

// Mark a thread as resolved
export function resolveThread(editor: Editor, threadId: string) {
  editor.view.dispatch(
    editor.state.tr.setMeta(commentThreadPluginKey, {
      type: "resolveThread",
      threadId,
    }),
  );
}
