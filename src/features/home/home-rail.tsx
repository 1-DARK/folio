import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-location";
import {
  AtSign,
  Calendar,
  Hash,
  Link2,
  Lock,
  MessagesSquare,
  Users,
} from "lucide-react";
import type { ChatRoom, NotificationType, Page, Teamspace } from "src/types";
import { InboxIcon } from "src/components/tiptap-icons";
import { Avatar } from "src/components/tiptap-ui-primitive/avatar";
import { useNotificationState } from "src/features/inbox/notification/notification-context";
import { useOpenNotification } from "src/features/inbox/inbox-panel/use-open-notification";
import {
  otherDmMember,
  roomTitle,
  useOpenChatRoom,
} from "src/features/chat/chat-utils";
import {
  useChatPeople,
  useChatRooms,
  useUnreadCounts,
} from "src/hooks/use-chat";
import { useTeamspaces } from "src/hooks/use-teamspaces";
import { useCurrentPerson } from "src/hooks/use-session";
import { spaceHomePath } from "src/hooks/use-current-space";
import { formatRelativeTime } from "src/utils/format-relative";
import { PageItemIcon } from "../pages/page-item/page-item-icon";

// Home's activity: what's waiting for you (inbox, rooms) and where your team
// works (teamspaces). The cards show a few items and link to the full list
// in the sidebar.

const RAIL_MAX = 4;
const EMPTY_TEAMSPACES: Teamspace[] = [];

function Badge({ value }: { value: number }) {
  if (value <= 0) return null;
  return <span className="home-card__badge">{value > 99 ? "99+" : value}</span>;
}

function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "user-mention":
    case "comment-mention":
      return <AtSign size={14} aria-hidden />;
    case "chat-mention":
      return <MessagesSquare size={14} aria-hidden />;
    case "date-due":
    case "date-overdue":
      return <Calendar size={14} aria-hidden />;
    case "backlink":
      return <Link2 size={14} aria-hidden />;
    default:
      return <InboxIcon size={14} aria-hidden />;
  }
}

// ── Inbox ─────────────────────────────────────────────────────────────────
export function HomeInboxCard({ onViewAll }: { onViewAll: () => void }) {
  const { t, i18n } = useTranslation();
  const { notifications, unreadCount } = useNotificationState();
  const open = useOpenNotification();
  const items = notifications.slice(0, RAIL_MAX);

  return (
    <section className="home-card" aria-labelledby="home-card-inbox">
      <header className="home-card__head">
        <InboxIcon className="home-card__head-icon" aria-hidden />
        <h2 id="home-card-inbox" className="home-card__title">
          {t("home.actions.inbox")}
        </h2>
        <Badge value={unreadCount} />
        <button type="button" className="home-card__link" onClick={onViewAll}>
          {t("home.viewAll", "View all")}
        </button>
      </header>
      {items.length === 0 ? (
        <p className="home-card__empty">{t("inbox.empty")}</p>
      ) : (
        <ul className="home-card__list">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`home-card__row${n.read ? "" : " is-unread"}`}
                onClick={() => void open(n)}
              >
                <span className="home-card__row-icon">
                  <NotifIcon type={n.type} />
                </span>
                <span className="home-card__row-text">
                  <span className="home-card__row-title">{n.title}</span>
                  {n.message && (
                    <span className="home-card__row-sub">{n.message}</span>
                  )}
                  <span className="home-card__row-meta">
                    {formatRelativeTime(
                      new Date(n.timestamp).getTime(),
                      t,
                      i18n.language,
                    )}
                  </span>
                </span>
                {!n.read && <span className="home-card__dot" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Rooms ─────────────────────────────────────────────────────────────────
// This space's rooms and your DMs: unread first, then the latest activity.
export function HomeRoomsCard({ onViewAll }: { onViewAll: () => void }) {
  const { t, i18n } = useTranslation();
  const { person } = useCurrentPerson();
  const { rooms, dms } = useChatRooms();
  const { data: unread = {} } = useUnreadCounts();
  const openRoom = useOpenChatRoom();

  const items = useMemo(
    () =>
      [...rooms, ...dms]
        .sort(
          (a, b) =>
            Number((unread[b.id] ?? 0) > 0) - Number((unread[a.id] ?? 0) > 0) ||
            (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt),
        )
        .slice(0, RAIL_MAX),
    [rooms, dms, unread],
  );
  const total = Object.values(unread).reduce((a, b) => a + b, 0);

  const partnerIds = useMemo(
    () =>
      items
        .filter((r) => r.kind === "dm")
        .map((r) => otherDmMember(r, person?.id))
        .filter((id): id is string => !!id),
    [items, person?.id],
  );
  const { data: people = [] } = useChatPeople(partnerIds);
  const peopleById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people],
  );

  const icon = (room: ChatRoom, title: string) => {
    if (room.kind === "dm") {
      const partner = peopleById.get(otherDmMember(room, person?.id) ?? "");
      return (
        <Avatar size="sm" src={partner?.avatarUrl ?? undefined} name={title} />
      );
    }
    return room.visibility === "private" ? (
      <Lock size={14} aria-hidden />
    ) : (
      <Hash size={14} aria-hidden />
    );
  };

  return (
    <section className="home-card" aria-labelledby="home-card-rooms">
      <header className="home-card__head">
        <MessagesSquare className="home-card__head-icon" aria-hidden />
        <h2 id="home-card-rooms" className="home-card__title">
          {t("home.rooms", "Rooms")}
        </h2>
        <Badge value={total} />
        <button type="button" className="home-card__link" onClick={onViewAll}>
          {t("home.allChats", "All chats")}
        </button>
      </header>
      {items.length === 0 ? (
        <p className="home-card__empty">{t("home.noRooms", "No rooms yet")}</p>
      ) : (
        <ul className="home-card__list">
          {items.map((room) => {
            const title = roomTitle(room, peopleById, person?.id, t);
            const count = unread[room.id] ?? 0;
            return (
              <li key={room.id}>
                <button
                  type="button"
                  className={`home-card__row${count > 0 ? " is-unread" : ""}`}
                  onClick={() => openRoom(room)}
                >
                  <span className="home-card__row-icon">
                    {icon(room, title)}
                  </span>
                  <span className="home-card__row-text">
                    <span className="home-card__row-title">{title}</span>
                    <span className="home-card__row-meta">
                      {room.lastMessageAt
                        ? formatRelativeTime(
                            room.lastMessageAt,
                            t,
                            i18n.language,
                          )
                        : t("chat.noMessages", "No messages yet")}
                    </span>
                  </span>
                  {count > 0 && (
                    <span className="home-card__count">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ── Teamspaces ────────────────────────────────────────────────────────────
// The current workspace's teamspaces as tiles. Name and icon live on each
// teamspace's root page (same id), so they come from the pages you already
// have, and so does the page count.
export function HomeTeamspaces({
  pages,
  currentId,
}: {
  pages: Page[];
  currentId: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useTeamspaces();
  const teamspaces = (data as Teamspace[] | undefined) ?? EMPTY_TEAMSPACES;

  const items = useMemo(() => {
    const byId = new Map(pages.map((p) => [p.id, p]));
    const pageCount = new Map<string, number>();
    for (const p of pages) {
      if (p.teamspaceId && p.id !== p.teamspaceId && p.sourceId == null) {
        pageCount.set(p.teamspaceId, (pageCount.get(p.teamspaceId) ?? 0) + 1);
      }
    }
    return teamspaces
      .flatMap((ts) => {
        const page = byId.get(ts.id);
        return page ? [{ ts, page, count: pageCount.get(ts.id) ?? 0 }] : [];
      })
      .sort((a, b) => (a.page.title || "").localeCompare(b.page.title || ""));
  }, [teamspaces, pages]);

  if (items.length === 0) return null;

  return (
    <section className="home-calm__section" aria-labelledby="home-teamspaces">
      <h2 id="home-teamspaces" className="home-calm__label">
        <Users size={14} aria-hidden />
        {t("home.teamspaces", "Teamspaces")}
      </h2>
      <div className="home-spaces">
        {items.map(({ ts, page, count }) => (
          <button
            key={ts.id}
            type="button"
            className={`home-space${ts.id === currentId ? " is-current" : ""}`}
            aria-current={ts.id === currentId ? "page" : undefined}
            onClick={() => navigate({ to: spaceHomePath(ts.id) })}
          >
            <span className="home-space__icon">
              <PageItemIcon
                cover={page.cover}
                styles={{ width: 18, height: 18, fontSize: 18 }}
              />
            </span>
            <span className="home-space__text">
              <span className="home-space__name">
                {page.title || t("teamspaces.untitled")}
              </span>
              <span className="home-space__meta">
                {t("teamspaces.memberCount", { count: ts.memberIds.length })}
                {" · "}
                {t("home.pageCount", { count })}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
