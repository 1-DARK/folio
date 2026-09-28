import { List } from "lucide-react";
import { MenuRow } from "../../../../../../features/database/components/menu-row";

// Edit property — navigates to the property list (submenu).
export function EditPropertyItem({ onOpen }: { onOpen: () => void }) {
  return (
    <MenuRow Icon={List} label="Edit property" navigable onClick={onOpen} />
  );
}
