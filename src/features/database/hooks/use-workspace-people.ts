import { usePeopleBase } from "src/hooks/use-people";
import type { Person, PersonValue } from "src/types";

// Workspace members as person-cell values. Empty while loading and when
// signed out (the landing page), so cells just show what they store.

const EMPTY: PersonValue[] = [];

// Module-level so React Query keeps the mapped result stable between renders.
const toValues = (people: Person[]): PersonValue[] =>
  people.map((p) => ({
    id: p.id,
    name: p.name || p.email,
    ...(p.avatarUrl ? { avatarUrl: p.avatarUrl } : {}),
  }));

export function useWorkspacePeople(): PersonValue[] {
  const { data } = usePeopleBase(toValues);
  return data ?? EMPTY;
}

/** One person by id, from the workspace members (null when unknown). */
export function findPerson(
  people: PersonValue[],
  id: string | null | undefined,
): PersonValue | null {
  if (!id) return null;
  return people.find((p) => p.id === id) ?? null;
}
