import { useNavigate } from "@tanstack/react-location";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbBooks } from "src/components/tiptap-icons";
import { SidebarNavRow } from "./sidebar-nav-row";
import { SB_ICON } from "./sidebar-icon";

export const LibraryPaletteTrigger = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <SidebarNavRow
      icon={<TbBooks {...SB_ICON} />}
      label={t("sidebar.library", "Library")}
      onClick={() => navigate({ to: "/library/Recents" })}
    />
  );
});
LibraryPaletteTrigger.displayName = "LibraryPaletteTrigger";
