import { useCallback, useSyncExternalStore } from "react";
import type { Editor } from "@tiptap/core";

/**
 * Reading `editor.isEditable` directly inside a node view is not reactive:
 * the view won't re-render when `editor.setEditable(...)` is called.
 *
 * This reads it with useSyncExternalStore: React asks for the value
 * (a boolean) after each editor update and re-renders only when it changed.
 * No setState in a listener, so no render loop. (useEditorState can't be
 * used here: it listens to transactions only, and setEditable emits an
 * "update" without a transaction.)
 *
 * Note: call `editor.setEditable(false)` with its default emitUpdate (don't
 * pass `false` as the 2nd arg), otherwise nothing is emitted.
 */
export function useEditorEditable(editor: Editor): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      editor.on("update", onChange);
      editor.on("transaction", onChange);
      return () => {
        editor.off("update", onChange);
        editor.off("transaction", onChange);
      };
    },
    [editor],
  );
  return useSyncExternalStore(subscribe, () => !!editor.isEditable);
}
