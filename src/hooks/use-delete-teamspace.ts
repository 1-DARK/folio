import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteTeamspace,
  deleteTeamspaceWithPages,
  moveTeamspaceToWorkspace,
} from "../api/teamspaces";
import type { ID, Page, Teamspace } from "../types";
import { queryKeys } from "../lib/queryKeys";

// Record-only delete. Used to roll back a teamspace whose page failed to
// create; deleting a real teamspace goes through useDeleteTeamspaceAndPages.
export function useDeleteTeamspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: ID) => {
      await deleteTeamspace(id);
    },
    onMutate: async (id: ID) => {
      await qc.cancelQueries({ queryKey: queryKeys.teamspaces.all });

      const previousTeamspaceList = qc.getQueriesData<Teamspace[]>({
        queryKey: queryKeys.teamspaces.lists(),
      });

      qc.setQueriesData<Teamspace[]>(
        { queryKey: queryKeys.teamspaces.lists() },
        (teamspaces) => (teamspaces ?? []).filter((t) => t.id !== id),
      );

      return { previousTeamspaceList };
    },
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.teamspaces.detail(id) });
    },
    onError: (_error, _vars, ctx) => {
      ctx?.previousTeamspaceList.forEach(([key, data]) =>
        qc.setQueryData(key, data),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamspaces.all });
    },
  });
}

// Deletes a teamspace with all of its pages (server RPC, owners only). The
// teamspace and its pages leave the caches right away and come back if the
// server refuses.
export function useDeleteTeamspaceAndPages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => deleteTeamspaceWithPages(id),
    onMutate: async (id: ID) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: queryKeys.teamspaces.all }),
        qc.cancelQueries({ queryKey: queryKeys.pages.all }),
      ]);

      const previousTeamspaces = qc.getQueriesData<Teamspace[]>({
        queryKey: queryKeys.teamspaces.lists(),
      });
      const previousPages = qc.getQueriesData<Page[]>({
        queryKey: queryKeys.pages.lists(),
      });

      qc.setQueriesData<Teamspace[]>(
        { queryKey: queryKeys.teamspaces.lists() },
        (list) => (list ?? []).filter((t) => t.id !== id),
      );
      qc.setQueriesData<Page[]>({ queryKey: queryKeys.pages.lists() }, (list) =>
        (list ?? []).filter((p) => p.id !== id && p.teamspaceId !== id),
      );

      return { previousTeamspaces, previousPages };
    },
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.teamspaces.detail(id) });
    },
    onError: (_error, _vars, ctx) => {
      ctx?.previousTeamspaces.forEach(([key, data]) =>
        qc.setQueryData(key, data),
      );
      ctx?.previousPages.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamspaces.all });
      qc.invalidateQueries({ queryKey: queryKeys.pages.all });
      qc.invalidateQueries({ queryKey: ["trashed-pages"] });
      qc.invalidateQueries({ queryKey: queryKeys.dataSources.all });
    },
  });
}

// Moves a teamspace (pages, templates, rooms) to another workspace the
// caller owns. Afterwards it belongs to that workspace, so it leaves this
// workspace's lists — the owner finds it after switching there.
export function useMoveTeamspaceToWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: ID; workspaceId: ID }) =>
      moveTeamspaceToWorkspace(id, workspaceId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamspaces.all });
      qc.invalidateQueries({ queryKey: queryKeys.pages.all });
      qc.invalidateQueries({ queryKey: ["trashed-pages"] });
      qc.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
  });
}
