import { useCallback, useSyncExternalStore } from "react";

// Which Learn guides this person has opened, on this device. A convenience
// for the home page's "Learn Folio" line: it can come back empty (private
// window, cleared site data) and the home page still works.

const KEY = "folio-guides-read";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.map(String) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGuidesRead() {
  const readIds = useSyncExternalStore(subscribe, read, () => EMPTY);

  const markRead = useCallback((id: string) => {
    const current = read();
    if (current.includes(id)) return;
    cache = [...current, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // Storage unavailable: remembered until the page reloads.
    }
    listeners.forEach((l) => l());
  }, []);

  return { readIds, markRead };
}
