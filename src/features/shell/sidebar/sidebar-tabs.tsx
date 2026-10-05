import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-location";
import { TbHome, TbInbox, TbMessages, TbSearch, TbX } from "src/components/tiptap-icons/tabler-icons";
import { useNotificationState } from "src/features/inbox/notification/notification-context";
import { useUnreadCounts } from "src/hooks/use-chat";
import { spaceHomePath, useCurrentSpace } from "src/hooks/use-current-space";
import { useIsMobile } from "src/hooks/use-breakpoint";
import { isMac } from "src/lib/tiptap-utils";
import {
  useEditorLayout,
  type SidebarView,
} from "../context/editor-layout-context";
import { SidebarSearchInput } from "./sidebar-search-input";
import { requestFindFocus } from "src/lib/find-store";
import { SidebarNavCount, SidebarNavRow } from "./sidebar-nav-row";
import { SB_ICON } from "./sidebar-icon";
import "./sidebar-tabs.scss";

type TabId = Extract<SidebarView, "pages" | "inbox" | "chats" | "teams">;

// The sidebar's top navigation, as rows: Search, Home, Inbox, Chats. Each
// row swaps what the sidebar body shows (same views as the old tab strip).
// Search turns its own row into the find input; × or Esc puts it back.
export const SidebarTabs = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const space = useCurrentSpace();
  const { sidebarView, setSidebarView, onCollapsedChange } = useEditorLayout();

  const { unreadCount } = useNotificationState();
  const { data: chatUnread = {} } = useUnreadCounts();
  const chatTotal = useMemo(
    () => Object.values(chatUnread).reduce((a, b) => a + b, 0),
    [chatUnread],
  );

  const isSearching = sidebarView === "search";
  const active: TabId =
    sidebarView === "inbox" ||
    sidebarView === "chats" ||
    sidebarView === "teams"
      ? sidebarView
      : "pages";

  // Same shortcut the editor toolbar listens for (Ctrl/⌘ + Shift + F).
  const findShortcut = isMac() ? "⌘⇧F" : "Ctrl+Shift+F";

  const selectTab = (id: TabId) => {
    // Home again while already on Home → go to the space's home page.
    if (id === "pages" && sidebarView === "pages") {
      const teamspaceId = space.kind === "teamspace" ? space.id : null;
      navigate({ to: spaceHomePath(teamspaceId) });
      if (isMobile) onCollapsedChange(true);
      return;
    }
    setSidebarView(id);
  };

  const openSearch = () => {
    setSidebarView("search");
    requestAnimationFrame(() => requestFindFocus());
  };

  const closeSearch = () => setSidebarView("pages");

  return (
    <div className="sb-nav">
      {/* Search row and find input share one slot and cross-fade. */}
      <div className={`sb-nav-search${isSearching ? " is-searching" : ""}`}>
        <div className="sb-nav-search__row" aria-hidden={isSearching}>
          <SidebarNavRow
            icon={<TbSearch {...SB_ICON} />}
            label={t("sidebar.search", "Search")}
            title={t("find.open", "Search in pages")}
            tabIndex={isSearching ? -1 : 0}
            onClick={openSearch}
            trailing={<kbd className="sb-nav-row__hint">{findShortcut}</kbd>}
          />
        </div>

        <div className="sb-nav-search__input" aria-hidden={!isSearching}>
          <SidebarSearchInput />
          <button
            type="button"
            className="sb-nav-search__close"
            aria-label={t("find.close", "Close search")}
            title={t("find.close", "Close search")}
            tabIndex={isSearching ? 0 : -1}
            onClick={closeSearch}
          >
            <TbX size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <SidebarNavRow
        icon={<TbHome {...SB_ICON} />}
        label={t("sidebar.home", "Home")}
        active={!isSearching && active === "pages"}
        onClick={() => selectTab("pages")}
      />
      <SidebarNavRow
        icon={<TbInbox {...SB_ICON} />}
        label={t("sidebar.inbox", "Inbox")}
        active={!isSearching && active === "inbox"}
        onClick={() => selectTab("inbox")}
        trailing={<SidebarNavCount value={unreadCount} />}
      />
      <SidebarNavRow
        icon={<TbMessages {...SB_ICON} />}
        label={t("chat.title", "Chats")}
        active={!isSearching && active === "chats"}
        onClick={() => selectTab("chats")}
        trailing={<SidebarNavCount value={chatTotal} />}
      />
    </div>
  );
});
SidebarTabs.displayName = "SidebarTabs";
