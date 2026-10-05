import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "src/features/shell/toast";
import { useTranslation } from "react-i18next";
import { trashPage, restorePage } from "src/api/pages-trash";
import { queryKeys } from "src/lib/queryKeys";
import type { ID } from "src/types";

export function useTrashPage() {
  const qc = useQueryClient();
  const { show } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      pageId,
      workspaceId,
    }: {
      pageId: string;
      workspaceId: ID;
    }) => trashPage(pageId, workspaceId),
    meta: { suppressErrorToast: false }, // network failures still toast via global handler
    onSuccess: (_data, { pageId, workspaceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.pages.lists(workspaceId) });
      qc.invalidateQueries({ queryKey: ["trashed-pages"] });

      // Success toast with Undo → restore.
      show(t("trash.movedToast"), "success", {
        label: t("trash.undo"),
        onClick: () => {
          restorePage(pageId).then(() => {
            qc.invalidateQueries({ queryKey: ["pages"] });
            qc.invalidateQueries({ queryKey: ["trashed-pages"] });
          });
        },
      });
    },
  });
}
