import { useEffect, useSyncExternalStore } from "react";

// Open state lives in a tiny module store read with useSyncExternalStore,
// so any button can open the one sheet that's mounted.

let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openShortcutSheet() {
  open = true;
  emit();
}
export function closeShortcutSheet() {
  open = false;
  emit();
}
function toggleShortcutSheet() {
  open = !open;
  emit();
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useSheetOpen = () => useSyncExternalStore(subscribe, () => open);

// Ctrl+/ — one window listener however many sheets are mounted.
let keyUsers = 0;
const onKey = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === "/") {
    e.preventDefault();
    toggleShortcutSheet();
  }
};

/** Registers Ctrl+/ (⌘/) while a sheet is mounted. */
export function useShortcutKey() {
  useEffect(() => {
    if (keyUsers++ === 0) window.addEventListener("keydown", onKey, true);
    return () => {
      if (--keyUsers === 0) window.removeEventListener("keydown", onKey, true);
    };
  }, []);
}
