import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-location";

// Any address the app doesn't know (an old or mistyped link) goes Home
// instead of showing a blank screen.
export function RedirectHome() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);
  return null;
}
