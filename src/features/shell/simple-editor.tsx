"use client";

// --- Styles ---
import "src/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "src/components/tiptap-node/code-block-node/code-block-node.scss";
import "src/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "src/components/tiptap-node/list-node/list-node.scss";
import "src/components/tiptap-node/image-node/image-node.scss";
import "src/components/tiptap-node/heading-node/heading-node.scss";
import "src/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "src/features/shell/simple-editor.scss";
import "src/features/editor/toc.scss";
import "src/features/pages/page-create-modal.scss";
import type { View } from "src/types";
import { usePageBrowserTab } from "./hooks/use-page-browser-tab";
import { HomePage, LibraryPage, PageEditorLayout } from "./views";
import { AppOverlays } from "./app-overlays";
import { SimpleEditorToolbar } from "./simple-editor-toolbar";
import { InboxPage } from "../inbox/inbox-page";
import { TrashPage } from "../pages/trash/trash-page";
import { useCurrentWorkspace } from "src/hooks/use-workspaces";
import { useApplyTheme } from "src/hooks/use-apply-theme";
import { useApplyLanguage } from "src/hooks/use-apply-language";
import { ChatRoomView } from "../chat/chat-room-view";
import { ShortcutSheet } from "src/components/tiptap-ui/shortcut-sheet";

function SimpleEditorMain({ view }: { view: View }) {
  return (
    <>
      {view === "home" && <HomePage />}

      {view === "library" && <LibraryPage />}

      {view === "page" && <PageEditorLayout />}

      {view === "inbox" && <InboxPage />}

      {view === "trash" && <TrashPage />}

      {view === "chat" && <ChatRoomView />}

      <AppOverlays />
    </>
  );
}

export function SimpleEditor({ view }: { view: View }) {
  const capitalized = view.charAt(0).toUpperCase() + view.slice(1);
  usePageBrowserTab("Folio", capitalized);
  const { workspace } = useCurrentWorkspace();

  // Theme and language are both per-workspace: applied straight from
  // workspace.settings, re-applied whenever the current workspace changes
  // (i.e. on switch). No per-person localStorage override anymore — that was
  // what made theme follow the person across workspaces.
  useApplyTheme(workspace?.settings.defaultTheme ?? "system");
  useApplyLanguage(workspace?.settings.language);

  return (
    <div className="simple-editor-wrapper">
      <SimpleEditorToolbar view={view} rectY={0} />
      <SimpleEditorMain view={view} />
      <ShortcutSheet />
    </div>
  );
}
