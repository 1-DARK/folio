import { useEffect, useMemo, useRef } from "react";
import type { Extensions } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import type { Page } from "src/types";
import { useActivePageActions } from "src/features/pages/context/active-page-context";
import { useCurrentPerson } from "src/hooks/use-session";
import { colorForPersonId } from "src/lib/person-color";
import type { EditorExtensionRefs } from "../context/editor-extension-refs";
import { useEditorExtensions } from "./use-editor-extensions";
import { useCollabDoc } from "./use-collab-doc";

// The peek and center views open the page's LIVE document — the same Yjs doc
// the full page and everyone else edits — instead of a separate editor that
// wrote JSON to pages.content (which the collaboration server then
// overwrote, losing the edits).
//
// They use the full editor's extension list on purpose: the Yjs ↔ editor
// binding DELETES any block it can't build from the shared doc, so a smaller
// schema would erase blocks for everyone.
export function usePeekCollab(page: Page) {
  const { setActivePageId } = useActivePageActions();
  const { person } = useCurrentPerson();

  const refsRef = useRef<EditorExtensionRefs>({
    setTocContent: () => {},
    setActivePageId,
  });
  useEffect(() => {
    refsRef.current.setActivePageId = setActivePageId;
  }, [setActivePageId]);

  const { extensions: base } = useEditorExtensions(refsRef);
  const { ydoc, provider, isSynced, unavailableOffline } = useCollabDoc(page);

  const extensions = useMemo<Extensions | null>(() => {
    if (!ydoc || !provider) return null;
    return [
      ...base,
      // Collaboration bundles its own @tiptap/core copy — cast at the
      // boundary, exactly like the full editor does.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Collaboration.configure({ document: ydoc }) as any,
      CollaborationCaret.configure({
        provider,
        user: {
          id: person?.id ?? null,
          name: person?.name ?? "Anonymous",
          color: person ? colorForPersonId(person.id) : "#999999",
          avatarUrl: person?.avatarUrl ?? null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    ] as Extensions;
    // person changes (name/avatar) don't warrant rebuilding the editor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, ydoc, provider]);

  return {
    extensions,
    provider,
    /** Synced (or opened from the offline copy) and ready to edit. */
    ready: isSynced && extensions != null,
    unavailableOffline,
  };
}
