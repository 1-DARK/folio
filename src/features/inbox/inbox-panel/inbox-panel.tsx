import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Inbox as InboxIcon,
  AtSign,
  Calendar,
  Link2,
  Check,
  ChevronRight,
  MessagesSquare,
} from "lucide-react";
import { useNotifications } from "src/features/inbox/notification/notification-context";
import type { Notification, NotificationType } from "src/types";
import { useOpenNotification } from "./use-open-notification";
import { WorkspaceInvites } from "./workspace-invites";
import { useMyWorkspaceInvites } from "src/hooks/use-workspace-members";
import "./inbox-panel.scss";

export function InboxPanel({ onOpened }: { onOpened?: () => void } = {}) {
  const { t } = useTranslation();
  // Already scoped to this workspace and to your notification settings.
  const {
    notifications,
    unreadCount,
    elsewhere,
    elsewhereUnreadCount,
    markAllRead,
  } = useNotifications();
  const open = useOpenNotification(onOpened);
  const { data: invites = [] } = useMyWorkspaceInvites();
  const [showElsewhere, setShowElsewhere] = useState(false);

  const item = (n: Notification) => (
    <button
      type="button"
      key={n.id}
      className={`inbox-item${n.read ? "" : " is-unread"}`}
      onClick={() => void open(n)}
    >
      <span className="inbox-item__icon">
        <NotifIcon type={n.type} />
      </span>
      <span className="inbox-item__text">
        <span className="inbox-item__title">{n.title}</span>
        <span className="inbox-item__message">{n.message}</span>
        <span className="inbox-item__time">{n.timestamp.toLocaleString()}</span>
      </span>
      {!n.read && <span className="inbox-item__dot" />}
    </button>
  );

  return (
    <div className="inbox-panel">
      <div className="inbox-panel__header">
        <span className="inbox-panel__title">
          {unreadCount > 0 && (
            <>
              {t("sidebar.inbox")}
              <span className="inbox-panel__count">{unreadCount}</span>
            </>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            className="inbox-panel__mark-all"
            onClick={() => markAllRead()}
          >
            <Check size={13} />
            <span>{t("inbox.markAllRead", "Mark all read")}</span>
          </button>
        )}
      </div>

      <div className="inbox-panel__body">
        <WorkspaceInvites onDone={onOpened} />
        {notifications.length === 0 &&
        elsewhere.length === 0 &&
        invites.length === 0 ? (
          <div className="inbox-panel__empty">
            <InboxIcon size={26} strokeWidth={1.5} />
            <p>{t("inbox.empty", "No notifications")}</p>
          </div>
        ) : (
          <>
            {notifications.map(item)}

            {elsewhere.length > 0 && (
              <div className="inbox-panel__elsewhere">
                <button
                  type="button"
                  className="inbox-panel__elsewhere-toggle"
                  aria-expanded={showElsewhere}
                  onClick={() => setShowElsewhere((v) => !v)}
                >
                  <ChevronRight
                    size={13}
                    style={{
                      transform: showElsewhere ? "rotate(90deg)" : "none",
                      transition: "transform 150ms ease",
                    }}
                  />
                  <span>{t("inbox.otherWorkspaces")}</span>
                  {elsewhereUnreadCount > 0 && (
                    <span className="inbox-panel__count">
                      {elsewhereUnreadCount}
                    </span>
                  )}
                </button>
                {showElsewhere && elsewhere.map(item)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "user-mention":
    case "comment-mention":
      return <AtSign size={15} />;
    case "chat-mention":
      return <MessagesSquare size={15} />;
    case "date-due":
    case "date-overdue":
      return <Calendar size={15} />;
    case "backlink":
      return <Link2 size={15} />;
    default:
      return <InboxIcon size={15} />;
  }
}
