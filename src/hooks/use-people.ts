import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Person, MemberRole, ID } from "../types";

import { queryKeys } from "../lib/queryKeys";

import { fetchPeople, fetchPeopleByIds, fetchPerson } from "../api/people";

import { useCurrentPerson } from "./use-session";

export function usePeopleBase<T>(select?: (people: Person[]) => T) {
  const { person, isLoading: personLoading } = useCurrentPerson();

  const workspaceId = person?.workspaceId;

  return useQuery({
    queryKey: queryKeys.people.lists(workspaceId ?? ""),
    queryFn: () => fetchPeople(workspaceId!),
    enabled: !personLoading && !!workspaceId,
    select,
  });
}

export function usePeople() {
  return usePeopleBase();
}

export function usePeopleByRole(role: MemberRole) {
  return usePeopleBase((people) => people.filter((p) => p.role === role));
}

export function usePerson(id: ID | null) {
  return useQuery({
    queryKey: queryKeys.people.detail(id ?? ""),
    queryFn: () => fetchPerson(id!),
    enabled: id != null,
  });
}

/**
 * People by id for display (names, avatars): your workspace's people, plus
 * anyone in `ids` who isn't in it — e.g. teamspace members from another
 * workspace who wrote a page or were given access to one. Only the missing
 * ids are fetched.
 */
export function usePeopleById(ids: (ID | null | undefined)[]) {
  const { data: people } = usePeople();
  const known = useMemo(
    () => new Map(((people ?? []) as Person[]).map((p) => [p.id, p])),
    [people],
  );
  const missing = useMemo(
    () =>
      [...new Set(ids.filter((id): id is ID => !!id && !known.has(id)))].sort(),
    [ids, known],
  );
  const { data: extra } = useQuery({
    queryKey: [...queryKeys.people.all, "by-ids", ...missing],
    queryFn: () => fetchPeopleByIds(missing),
    enabled: people !== undefined && missing.length > 0,
    staleTime: 5 * 60_000,
  });
  return useMemo(() => {
    if (!extra?.length) return known;
    const all = new Map(known);
    for (const p of extra) if (!all.has(p.id)) all.set(p.id, p);
    return all;
  }, [known, extra]);
}
