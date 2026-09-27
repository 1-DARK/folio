// Local copies of collaborative page docs, so pages you've opened on this
// device still open (and stay editable) while offline.
//
// Per person + page, two IndexedDB keys:
//   doc:<personId>:<pageId>    the full Yjs state (Y.encodeStateAsUpdate)
//   dirty:<personId>:<pageId>  true when it holds edits the server hasn't
//                              received yet (made while offline, or while the
//                              connection was down)
//
// Keyed by person so a shared device never serves one account's pages to
// another. Every call swallows storage errors (private mode, quota): offline
// copies are a convenience, never load-bearing.

const DB_NAME = "folio-offline";
const STORE = "docs";

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
  // A failed open can be retried later (e.g. storage freed up).
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function request<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

const docKey = (personId: string, pageId: string) =>
  `doc:${personId}:${pageId}`;
const dirtyKey = (personId: string, pageId: string) =>
  `dirty:${personId}:${pageId}`;

export async function loadDocCache(
  personId: string,
  pageId: string,
): Promise<{ update: Uint8Array | null; dirty: boolean }> {
  try {
    const [update, dirty] = await Promise.all([
      request<unknown>("readonly", (s) => s.get(docKey(personId, pageId))),
      request<unknown>("readonly", (s) => s.get(dirtyKey(personId, pageId))),
    ]);
    return {
      update: update instanceof Uint8Array ? update : null,
      dirty: dirty === true,
    };
  } catch {
    return { update: null, dirty: false };
  }
}

export function saveDocCache(
  personId: string,
  pageId: string,
  update: Uint8Array,
): void {
  request("readwrite", (s) => s.put(update, docKey(personId, pageId))).catch(
    () => {},
  );
}

export function markDocDirty(personId: string, pageId: string): void {
  request("readwrite", (s) => s.put(true, dirtyKey(personId, pageId))).catch(
    () => {},
  );
}

export function markDocClean(personId: string, pageId: string): void {
  request("readwrite", (s) => s.delete(dirtyKey(personId, pageId))).catch(
    () => {},
  );
}

/** Drop every offline copy on this device — call on sign-out. */
export function clearOfflineDocCache(): void {
  request("readwrite", (s) => s.clear()).catch(() => {});
}
