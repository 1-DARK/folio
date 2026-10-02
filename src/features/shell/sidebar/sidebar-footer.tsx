import { memo } from "react";
import { NewPageButton } from "./new-page-button";
import "./sidebar-footer.scss";

// Pinned under the page tree: New page (it moved here from the top row,
// which is now the space switcher).
export const SidebarFooter = memo(() => {
  return (
    <div className="sb-footer">
      <NewPageButton className="sb-footer__new" label />
    </div>
  );
});
SidebarFooter.displayName = "SidebarFooter";
