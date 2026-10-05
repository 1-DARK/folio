import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "src/features/shell/confirm-dialog";
import { signOut, subscribeSignOutConfirm } from "./sign-out";

// The one "you have unsynced changes" dialog for signing out. Mounted once
// (AppOverlays); requestSignOut() opens it.
export function SignOutHost() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeSignOutConfirm(setOpen), []);

  const cancel = useCallback(() => setOpen(false), []);
  const confirm = useCallback(() => {
    setOpen(false);
    signOut(qc).catch((e) => console.error("sign-out failed:", e));
  }, [qc]);

  return (
    <ConfirmDialog
      open={open}
      message={
        <>
          {t("account.unsyncedTitle")}
          <br />
          <span style={{ fontSize: 13, opacity: 0.7 }}>
            {t("account.unsyncedBody")}
          </span>
        </>
      }
      confirmLabel={t("account.logOutAnyway")}
      cancelLabel={t("actions.cancel", "Cancel")}
      onCancel={cancel}
      onConfirm={confirm}
    />
  );
}
