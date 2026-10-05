import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "src/api/supabase-client";
import { hasDirtyDocs } from "src/lib/offline-doc-cache";
import { wipeAndReloadHome } from "src/lib/query-persistence";

// ONE way to sign out, used by every "Log out" button (user menu, workspace
// switcher) and by deleting your workspace.
//
//   1. A normal sign-out also revokes the session on the server. If that
//      fails — offline, or a network error — a local sign-out still ends
//      the session on this device (no network needed) instead of silently
//      leaving you signed in.
//   2. Then this device's offline data is wiped and the app reloads at "/",
//      the landing page — so the next person who signs in here starts fresh,
//      not on the previous person's page. (The auth listener does the same
//      for sign-outs from another tab; it only ever runs once.)
export async function signOut(qc: QueryClient): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    const { error: localError } = await supabase.auth.signOut({
      scope: "local",
    });
    if (localError) throw localError;
  }
  await wipeAndReloadHome(() => qc.clear());
}

/** Changes that would be lost by signing out now: page edits not yet sent
 *  to the server, or saves queued while offline. */
export async function hasUnsyncedWork(qc: QueryClient): Promise<boolean> {
  const queued = qc
    .getMutationCache()
    .getAll()
    .some((m) => m.state.isPaused);
  return queued || (await hasDirtyDocs());
}

// ── Confirmation when something hasn't synced ───────────────────────────
// A tiny store so any button can ask, and one dialog (SignOutHost, mounted
// once) answers — the button's own menu or popover may close meanwhile.

type Listener = (open: boolean) => void;
let listener: Listener | null = null;

export function subscribeSignOutConfirm(l: Listener): () => void {
  listener = l;
  return () => {
    if (listener === l) listener = null;
  };
}

/**
 * What "Log out" buttons call: signs out right away, or first asks when
 * there are changes that haven't reached the server yet (they'd be lost).
 */
export async function requestSignOut(qc: QueryClient): Promise<void> {
  if (listener && (await hasUnsyncedWork(qc))) {
    listener(true);
    return;
  }
  await signOut(qc);
}
