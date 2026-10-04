import { TbChevronsLeft, TbChevronsRight } from "react-icons/tb";
import { SB_ICON } from "./sidebar-icon";
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

// The space switcher on top (the collapse chevrons appear on hover), the tab
// strip (+ search) below it. New page lives in the footer (sidebar-footer).
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
        <div className="sb-top" style={{ paddingTop: 6 }}>
          <User />
          {/* Revealed on hover/focus of the top row (always on touch). */}
          <span className="sb-top__collapse">
            <Button
              variant="ghost"
              size="large"
              tooltip={collapsed ? t("sidebar.collapsed") : t("sidebar.expand")}
              onClick={() => {
                if (!collapsed) collapseWithFloat();
                else onCollapsedChange(!collapsed);
              }}
            >
              {collapsed ? (
                <TbChevronsRight {...SB_ICON} className="tiptap-button-icon" />
              ) : (
                <TbChevronsLeft {...SB_ICON} className="tiptap-button-icon" />
              )}
            </Button>
          </span>
        </div>

        <Spacer orientation="vertical" size={8} />
        <SidebarTabs />
        <Spacer orientation="vertical" size={4} />
      </CardItemGroup>
    </CardHeader>
  );
});
