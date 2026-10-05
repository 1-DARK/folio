import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";
import { clearOfflineDocCache } from "src/lib/offline-doc-cache";

// Saves React Query's cache (pages list, threads, people, roles…) to
// IndexedDB so the app starts with data after a reload — instantly online,
// and at all offline.
//
// Stored in its own tiny IndexedDB key/value store (localStorage caps at
// ~5 MB and the pages list carries every page's content).

const DB_NAME = "folio-query-cache";
const STORE = "kv";
const PERSIST_KEY = "react-query";
const OWNER_KEY = "folio-cache-owner";

/** How long a saved cache is trusted. Also used as the default gcTime, so
 *  restored queries aren't garbage-collected right away. */
export const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

/** Bump when a cached shape changes incompatibly — old caches are dropped. */
export const QUERY_CACHE_BUSTER = "v1";

// Query keys (first segment) never written to disk:
//   notifications — Notification.timestamp is a Date, which JSON turns into a
//                   string
//   session       — the Supabase session (tokens) already lives in the SDK's
//                   own storage; a restored copy would be stale, and
//                   staleTime: Infinity would keep serving it
const NOT_PERSISTED = new Set<string>(["notifications", "session"]);

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = op(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// The async storage interface the persister expects. Failures (private mode,
// quota) degrade to "no saved cache" instead of breaking the app.
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await run<unknown>("readonly", (s) => s.get(key));
      return typeof value === "string" ? value : null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await run("readwrite", (s) => s.put(value, key));
    } catch {
      /* ignore */
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await run("readwrite", (s) => s.delete(key));
    } catch {
      /* ignore */
    }
  },
};

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: PERSIST_KEY,
  throttleTime: 1000,
});

/** Which queries get written to disk: successful ones, minus the denylist. */
export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== "success") return false;
  const head = query.queryKey[0];
  return !(typeof head === "string" && NOT_PERSISTED.has(head));
}

/**
 * Makes sure a saved cache belongs to whoever is signed in. When a different
 * person signs in on this device, the previous person's saved queries and
 * page copies are dropped (OfflineCacheGuard runs this before rendering).
 */
export function claimOfflineCache(
  personId: string,
  clearQueries: () => void,
): void {
  let previous: string | null = null;
  try {
    previous = localStorage.getItem(OWNER_KEY);
  } catch {
    /* storage blocked */
  }
  if (previous && previous !== personId) {
    clearQueries();
    void queryPersister.removeClient();
    void clearOfflineDocCache();
  }
  try {
    localStorage.setItem(OWNER_KEY, personId);
  } catch {
    /* storage blocked */
  }
}

/** Sign-out: drop every offline copy (queries + page docs) on this device. */
export function clearOfflineData(clearQueries: () => void): void {
  clearQueries();
  void queryPersister.removeClient();
  void clearOfflineDocCache();
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    /* storage blocked */
  }
}

let leaving = false;

/**
 * After signing out (here or in another tab): wipe this device's offline
 * data — saved queries and page copies — then reload at "/", the landing
 * page.
 *
 * A full reload rather than re-rendering in place: emptying the query cache
 * doesn't re-render the screens reading it (the app just sat there), and a
 * reload also closes every live connection and resets all in-memory state,
 * so nothing of the previous account survives. Runs once even if called
 * twice (sign-out + its auth event).
 */
export async function wipeAndReloadHome(clearQueries: () => void) {
  if (leaving) return;
  leaving = true;
  clearQueries();
  await Promise.allSettled([
    queryPersister.removeClient(),
    clearOfflineDocCache(),
  ]);
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    /* storage blocked */
  }
  window.location.replace("/");
}
