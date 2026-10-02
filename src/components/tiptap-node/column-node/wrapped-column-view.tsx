import type { ReactNodeViewProps } from "@tiptap/react";
import ColumnView from "./column-view";

// Kept as the node view entry (column.ts). Resizing now lives in ColumnView
// and saves percentages, so there is no resize provider here any more.
export function WrappedColumnView(props: ReactNodeViewProps) {
  return <ColumnView {...props} />;
}
