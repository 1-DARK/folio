import { createContext, useContext } from "react";
import type { ID, Page } from "src/types";

export interface ActivePageActions {
  setActivePageId: (id: ID | null) => void;
}
export interface ActivePageState {
  activePageId: ID | null;
  activePage: Page | undefined;
  isLoading: boolean;
}
export const ActivePageActionsContext = createContext<ActivePageActions | null>(
  null,
);
export const ActivePageStateContext = createContext<ActivePageState | null>(
  null,
);

export function useActivePageActions() {
  const ctx = useContext(ActivePageActionsContext);
  if (!ctx) throw new Error("useActivePageActions outside ActivePageProvider");
  return ctx;
}
export function useActivePageState() {
  const ctx = useContext(ActivePageStateContext);
  if (!ctx) throw new Error("useActivePageState outside ActivePageProvider");
  return ctx;
}
// shim (delete after migration):
export function useActivePage() {
  return { ...useActivePageActions(), ...useActivePageState() };
}

// For UI that also renders outside the app's providers (the landing's live
// editor): no provider → no active page, and setting one does nothing.
const NO_ACTIVE_PAGE: ActivePageActions & ActivePageState = {
  setActivePageId: () => {},
  activePageId: null,
  activePage: undefined,
  isLoading: false,
};
export function useOptionalActivePage(): ActivePageActions & ActivePageState {
  const actions = useContext(ActivePageActionsContext);
  const state = useContext(ActivePageStateContext);
  if (!actions || !state) return NO_ACTIVE_PAGE;
  return { ...actions, ...state };
}
