import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbTemplate } from "react-icons/tb";
import { useTemplates } from "../../pages/templates/templates-context";
import { useIsMobile } from "src/hooks/use-breakpoint";
import { useEditorLayoutActions } from "../context/editor-layout-context";
import { SidebarNavRow } from "./sidebar-nav-row";
import { SB_ICON } from "./sidebar-icon";

export const TemplatePaletteTrigger = memo(() => {
  const { t } = useTranslation();
  const { onOpenChange, open } = useTemplates();
  const isMobile = useIsMobile();
  const { onCollapsedChange } = useEditorLayoutActions();

  return (
    <SidebarNavRow
      icon={<TbTemplate {...SB_ICON} />}
      label={t("sidebar.templates", "Templates")}
      onClick={() => {
        onOpenChange?.(!open);
        onCollapsedChange(isMobile);
      }}
    />
  );
});
TemplatePaletteTrigger.displayName = "TemplatePaletteTrigger";
