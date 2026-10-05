// An invite link opened while signed out is remembered here, so the app can
// open it again once you've signed in.

const PENDING_KEY = "folio:pending-invite";

/** Remember an invite link opened while signed out, to finish after sign-in. */
export function rememberPendingInvite(token: string) {
  try {
    localStorage.setItem(PENDING_KEY, token);
  } catch {
    /* storage blocked */
  }
}

/** The remembered invite token (and forget it). */
export function takePendingInvite(): string | null {
  try {
    const token = localStorage.getItem(PENDING_KEY);
    if (token) localStorage.removeItem(PENDING_KEY);
    return token;
  } catch {
    return null;
  }
}

export const tokenFromInvitePath = (pathname: string): string | null =>
  pathname.match(/^\/invite\/([^/?#]+)/)?.[1] ?? null;
