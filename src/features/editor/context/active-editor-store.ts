import { useSyncExternalStore } from "react";
import type { Editor } from "@tiptap/react";

// The page editor that is open right now, for UI that lives outside the
// editor's provider — the top bar's page menu (Export) sits above
// EditorProvider, so useCurrentEditor() is always null there.
//
// EditorInstance registers its editor on mount and clears it on unmount.

let active: Editor | null = null;
const listeners = new Set<() => void>();

export function setActiveEditor(editor: Editor | null) {
  if (active === editor) return;
  active = editor;
  listeners.forEach((l) => l());
}

/** Clears the active editor only if it is still `editor`. */
export function clearActiveEditor(editor: Editor | null) {
  if (active === editor) setActiveEditor(null);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useActiveEditor(): Editor | null {
  return useSyncExternalStore(subscribe, () => active);
}

/** The open page editor right now, outside React (e.g. in an event handler). */
export function getActiveEditor(): Editor | null {
  return active;
}
