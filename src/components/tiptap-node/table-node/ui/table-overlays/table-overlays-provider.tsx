import { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import type { ReactNode } from "react";
import { TableOverlaysContext } from "./table-overlays-context";
import { tableContextPluginKey } from "../../extensions/table-context";

interface OverlayGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  tableWidth: number;
  tableHeight: number;
  isLastCol: boolean;
  isLastRow: boolean;
}

const EMPTY: OverlayGeometry = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  tableWidth: 0,
  tableHeight: 0,
  isLastCol: false,
  isLastRow: false,
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// Where the row/column handles and add buttons go, read from the table
// context plugin through useEditorState (re-renders only when a value
// changes). Off the table, everything is 0 and the handles hide.
export function TableOverlaysProvider({
  children,
  editor,
}: {
  children: ReactNode;
  editor: Editor | null;
}) {
  const geometry =
    useEditorState({
      editor,
      selector: ({ editor }): OverlayGeometry => {
        const s = editor ? tableContextPluginKey.getState(editor.state) : null;
        if (!s?.parentTableDOM || s.columnIndex === -1) return EMPTY;
        const cols = s.cols ?? [];
        const rows = s.rows ?? [];
        return {
          left: sum(cols.slice(0, s.currentCol?.index ?? 0)),
          top: sum(rows.slice(0, s.currentRow?.index ?? 0)),
          width: s.currentCol?.width ?? 0,
          height: s.currentRow?.height ?? 0,
          tableWidth: sum(cols),
          tableHeight: sum(rows),
          isLastCol: s.isLastColumn ?? false,
          isLastRow: s.isLastRow ?? false,
        };
      },
    }) ?? EMPTY;

  return (
    <TableOverlaysContext.Provider value={{ editor, ...geometry }}>
      {children}
    </TableOverlaysContext.Provider>
  );
}
