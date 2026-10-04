import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ID, Person } from "../types";
import { queryKeys } from "../lib/queryKeys";

export type PersonPatch = Partial<Omit<Person, "id">>;

export function usePatchPerson(
  mutationFn: (args: { id: ID; patch: PersonPatch }) => Promise<Person>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async ({ id, patch }: { id: ID; patch: PersonPatch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.people.all });

      // Match on the `all` prefix (["people"]) rather than lists(workspaceId):
      // an optimistic person patch should apply to EVERY cached people-list
      // regardless of which workspace it's keyed under, and lists() now
      // requires a workspaceId this hook has no single correct value for.
      // A prefix query matches all ["people", "list", <anyWsId>] entries.
      const previousPeople = qc.getQueriesData<Person[]>({
        queryKey: queryKeys.people.all,
      });
      const previousPersonDetail = qc.getQueryData<Person>(
        queryKeys.people.detail(id),
      );

      qc.setQueriesData<Person[]>(
        { queryKey: queryKeys.people.all },
        (old) =>
          Array.isArray(old)
            ? old.map((o) => (o.id === id ? { ...o, ...patch } : o))
            : old,
      );
      qc.setQueryData<Person>(queryKeys.people.detail(id), (p) =>
        p?.id === id ? { ...p, ...patch } : p,
      );

      return { previousPeople, previousPersonDetail };
    },
    onError: (_error, vars, ctx) => {
      ctx?.previousPeople.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.previousPersonDetail)
        qc.setQueryData(
          queryKeys.people.detail(vars.id),
          ctx.previousPersonDetail,
        );
    },
    onSettled: () => {
      qc.cancelQueries({ queryKey: queryKeys.people.all });
    },
  });
}