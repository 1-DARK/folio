import { useDatabaseContext } from "../../../../../features/database/context/database-context";

export function useChipVisibility() {
  const { showFilterChips, showSortChips } = useDatabaseContext();

  return { showFilterChips, showSortChips };
}
