import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { Page } from "src/types";

// A page's title lives in two places: the title block at the top of its
// live document, and the pages.title column (sidebar, search, lists). Typing
// in the editor writes the column; these keep the block in step when the
// column changes from somewhere else (renaming in the sidebar), so the old
// name doesn't come back the next time someone types in the title.

/** Titles a new page starts with — never pushed into the document (an
 *  untitled page should show its placeholder, not this text). */
const DEFAULT_TITLES = new Set([
  "",
  "New Page",
  "Untitled",
  "Nouvelle page",
  "Nouvelle Page",
  "Sans titre",
]);

/** Replaces the text of the document's title block. True if it changed. */
export function setEditorTitle(editor: Editor, title: string): boolean {
  const first = editor.state.doc.firstChild;
  if (!first || first.type.name !== "title") return false;
  if (first.textContent === title) return false;
  const tr = editor.state.tr;
  const from = 1;
  const to = 1 + first.content.size;
  if (title) tr.replaceWith(from, to, editor.schema.text(title));
  else tr.delete(from, to);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
  return true;
}

/**
 * Once the editor is ready (and you can edit), bring the title block in line
 * with pages.title if the page was renamed elsewhere since it was last open.
 */
export function useSyncDocTitle(
  editor: Editor | null,
  page: Page,
  canEdit: boolean,
  roleLoading: boolean,
) {
  const doneRef = useRef(false);
  useEffect(() => {
    if (!editor || roleLoading || doneRef.current) return;
    doneRef.current = true;
    if (!canEdit) return;
    const want = (page.title ?? "").trim();
    if (DEFAULT_TITLES.has(want)) return;
    setEditorTitle(editor, want);
    // Runs once per editor — later title changes come from typing in it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, roleLoading, canEdit]);
}
