import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useIsRestoring } from "@tanstack/react-query";
import { useAuthListener, useCurrentPerson } from "src/hooks/use-session";
import "./auth-gate.scss";

// Signed-out screens, each its own chunk: a signed-in person never downloads
// the landing page, and a visitor only gets the one they're looking at.
const Landing = lazy(() =>
  import("../../landing").then((m) => ({ default: m.Landing })),
);
const SignIn = lazy(() =>
  import("../sign-in").then((m) => ({ default: m.SignIn })),
);

const SIGN_IN_PATH = "/signin";

// Signed out, "/" is the landing page; every other address (a shared page
// link, /signin) goes straight to sign-in.
const isLandingPath = (path: string) => path === "/" || path === "";

/**
 * Wrap the app root with this. Renders a simple loading ring while the
 * session is resolving (fast — reads local storage, no network), then for
 * signed-out visitors the landing page at "/" and SignIn everywhere else,
 * then children once there's a real signed-in person. The sidebar/editor
 * content have their own skeletons for once the real app mounts, so this
 * doesn't need to mimic the layout.
 *
 * The gate sits outside the router, so it tracks the address itself: the
 * landing page's buttons push /signin, and the browser's back button
 * returns to the landing page.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  // The app's one auth-event listener (sign-in, refresh, sign-out).
  useAuthListener();
  const { isAuthenticated, isLoading } = useCurrentPerson();
  // While the saved cache is being restored, queries haven't started, so
  // "no session yet" doesn't mean signed out — keep the ring up instead of
  // flashing the landing / sign-in screen.
  const isRestoring = useIsRestoring();
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Signed in while on /signin: the app has no /signin route, so go home.
  // A full navigation (once, right after signing in) lets the router start
  // cleanly at "/" instead of patching its history from outside it.
  const signedInOnSignInPage = isAuthenticated && path === SIGN_IN_PATH;
  useEffect(() => {
    if (signedInOnSignInPage) window.location.replace("/");
  }, [signedInOnSignInPage]);

  const goToSignIn = () => {
    window.history.pushState(null, "", SIGN_IN_PATH);
    setPath(SIGN_IN_PATH);
  };

  if (isRestoring || isLoading || signedInOnSignInPage) return <GateLoading />;

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<GateLoading />}>
        {isLandingPath(path) ? (
          <Landing onGetStarted={goToSignIn} onSignIn={goToSignIn} />
        ) : (
          <SignIn />
        )}
      </Suspense>
    );
  }

  return <>{children}</>;
}

/** The ring shown while the session resolves or a screen's code loads. */
export function GateLoading() {
  return (
    <div className="auth-gate-loading">
      <div className="auth-gate-loading__ring" />
    </div>
  );
}
