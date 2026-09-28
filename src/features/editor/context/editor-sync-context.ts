import { createContext, useContext } from "react";

// True while the active page's collaborative doc is still connecting/syncing
// (the window between switching to a page and its Yjs doc being ready). The
// existing editor-skeleton-overlay uses this to cover just the content area
// during that gap, instead of showing a blank editor.
//
// unavailableOffline: offline, and this page has no local copy on this
// device (never opened here) — show that instead of an endless skeleton.
export const EditorSyncContext = createContext<{
  isSyncing: boolean;
  unavailableOffline: boolean;
}>({
  isSyncing: false,
  unavailableOffline: false,
});

export function useEditorSync() {
  return useContext(EditorSyncContext);
}
