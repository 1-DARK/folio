import { useDatabaseContext } from "../../../../../components/tiptap-node/inline-database/context/database-context";

export function useChipVisibility() {
  const { showFilterChips, showSortChips } = useDatabaseContext();

  return { showFilterChips, showSortChips };
}
