import { createContext, useContext } from "react";
import type { Notification } from "src/types";

export interface NotificationActions {
  addNotification: (
    payload: Omit<Notification, "id" | "timestamp" | "read"> & {
      recipientId?: string;
      dedupKey?: string;
    },
  ) => void;
  markRead: (id: string) => void;
  /** Marks these as read — by default, everything in the current workspace's
   *  inbox. */
  markAllRead: (ids?: string[]) => void;
  dismiss: (id: string) => void;
  /** Removes these — by default, everything in the current workspace's inbox. */
  dismissAll: (ids?: string[]) => void;
  hasNotified: (key: string) => boolean;
  registerNotified: (key: string) => void;
}

export interface NotificationState {
  /** The current workspace's inbox, newest first, without the types turned
   *  off in notification settings. */
  notifications: Notification[];
  /** Unread in `notifications` — what every badge shows. */
  unreadCount: number;
  /** For pages/rooms in your other workspaces (or no longer reachable). */
  elsewhere: Notification[];
  elsewhereUnreadCount: number;
  /** The first load of notifications has finished (successfully or not). */
  ready: boolean;
}

export const NotificationActionsContext =
  createContext<NotificationActions | null>(null);
export const NotificationStateContext = createContext<NotificationState | null>(
  null,
);

export function useNotificationActions() {
  const ctx = useContext(NotificationActionsContext);
  if (!ctx)
    throw new Error("useNotificationActions outside NotificationProvider");
  return ctx;
}
export function useNotificationState() {
  const ctx = useContext(NotificationStateContext);
  if (!ctx)
    throw new Error("useNotificationState outside NotificationProvider");
  return ctx;
}
// back-compat shim (delete after migrating consumers):
export function useNotifications() {
  return { ...useNotificationActions(), ...useNotificationState() };
}
