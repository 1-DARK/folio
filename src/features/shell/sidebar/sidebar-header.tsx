import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/tiptap-ui-primitive/button";
import {
  CardHeader,
  CardItemGroup,
} from "src/components/tiptap-ui-primitive/card";
import { Spacer } from "src/components/tiptap-ui-primitive/spacer";
import {
  useEditorLayoutActions,
  useEditorLayoutState,
} from "../context/editor-layout-context";
import { User } from "./sidebar-user";
import { SidebarTabs } from "./sidebar-tabs";
import "./sidebar-tabs.scss";
import { NewPageButton } from "./new-page-button";

// Workspace switcher on top (the collapse chevrons appear on hover), the tab
// strip (+ search) below it. Inside a teamspace, a back arrow before the
// teamspace's icon returns to your workspace.
export const SidebarHeader = memo(() => {
  const { t } = useTranslation();
  const { onCollapsedChange, collapseWithFloat } = useEditorLayoutActions();
  const { collapsed } = useEditorLayoutState();

  return (
    <CardHeader
      className="sidebar-header-content"
      style={{ border: "none", padding: 0 }}
    >
      <CardItemGroup
        style={{
          width: "100%",
          padding: "0px 5px",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <div className="sb-top">
          <CardItemGroup
            orientation="horizontal"
            className="workspace-switcher sb-top__switcher"
            style={{
              padding: "2px 0px",
            }}
          >
            <User />
            <Spacer orientation="horizontal" />

            <NewPageButton />
            {/* Revealed on hover/focus of the top row (always on touch). */}
            <span className="sb-top__collapse">
              <Button
                variant="ghost"
                size="large"
                tooltip={
                  collapsed ? t("sidebar.collapsed") : t("sidebar.expand")
                }
                onClick={() => {
                  if (!collapsed) collapseWithFloat();
                  else onCollapsedChange(!collapsed);
                }}
              >
                {collapsed ? (
                  <ChevronsRight className="tiptap-button-icon" />
                ) : (
                  <ChevronsLeft className="tiptap-button-icon" />
                )}
              </Button>
            </span>
          </CardItemGroup>
        </div>

        <Spacer orientation="vertical" size={10} />
        <SidebarTabs />
        <Spacer orientation="vertical" size={6} />
      </CardItemGroup>
    </CardHeader>
  );
});
