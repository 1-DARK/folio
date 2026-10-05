import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "src/api/supabase-client";
import { hasDirtyDocs } from "src/lib/offline-doc-cache";

// ONE way to sign out, used by every "Log out" button (user menu, workspace
// switcher) and by deleting your workspace.
//
//   1. The address goes back to "/" first, so the next person who signs in
//      on this device doesn't start on the previous person's page (and the
//      sign-out lands on the landing page, not wherever the gate last was).
//   2. A normal sign-out also revokes the session on the server. If that
//      fails — offline, or a network error — a local sign-out still ends
//      the session on this device (no network needed) instead of silently
//      leaving you signed in.
//   3. Either way SIGNED_OUT fires; the auth listener (useAuthListener)
//      wipes this device's offline data and the gate shows the landing page.
export async function signOut(): Promise<void> {
  if (window.location.pathname !== "/") {
    window.history.replaceState(null, "", "/");
    // The gate and router track the address themselves; tell them.
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  const { error } = await supabase.auth.signOut();
  if (!error) return;

  const { error: localError } = await supabase.auth.signOut({
    scope: "local",
  });
  if (localError) throw localError;
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
  await signOut();
}
