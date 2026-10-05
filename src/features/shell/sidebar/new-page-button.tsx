import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbEdit } from "src/components/tiptap-icons";
import { SB_ICON } from "./sidebar-icon";
import { useCreatePageInSpace } from "src/api/use-create-page-in-space";
import { useActivePageActions } from "../../pages/context/active-page-context";
import { useIsMobile } from "src/hooks/use-breakpoint";
import { useEditorLayoutActions } from "../context/editor-layout-context";
import { Button } from "src/components/tiptap-ui-primitive/button";

// The footer's compose button: a new page in the current space.
export const NewPageButton = memo(
  ({ className, label = false }: { className?: string; label?: boolean }) => {
    const { t } = useTranslation();
    const { createPageInSpace, isPending } = useCreatePageInSpace();
    const { setActivePageId } = useActivePageActions();
    const isMobile = useIsMobile();
    const { onCollapsedChange } = useEditorLayoutActions();

    return (
      <Button
        type="button"
        size="large"
        className={className}
        aria-label={t("page.newPage")}
        tooltip={t("page.newPage")}
        disabled={isPending}
        onClick={() => {
          createPageInSpace(t("page.newPage"))
            .then((page) => {
              if (!page) return;
              setActivePageId(page.id);
              if (isMobile) onCollapsedChange(true);
            })
            .catch(() => {});
        }}
        variant="ghost"
      >
        <TbEdit {...SB_ICON} className="tiptap-button-icon" />
        {label && (
          <span className="tiptap-button-text">{t("page.newPage")}</span>
        )}
      </Button>
    );
  },
);
NewPageButton.displayName = "NewPageButton";
