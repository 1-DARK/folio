import type { ID, Person } from "src/types";
import { http, keysToCamel } from "./client";
import { supabase } from "./supabase-client";

/** Everyone in a workspace — every member, not only the ones currently
 *  switched into it — with their role in THAT workspace (migration 041). */
export async function fetchPeople(workspaceId: ID): Promise<Person[]> {
  const { data, error } = await supabase.rpc("workspace_people", {
    ws: workspaceId,
  });
  if (error) throw new Error(error.message);
  return keysToCamel(data ?? []) as Person[];
}

export const fetchPerson = (id: ID) => http<Person>(`/people/${id}`);

export const deletePerson = (id: ID) =>
  http<void>(`/people/${id}`, { method: "DELETE" });

export const patchPerson = (id: ID, patch: Partial<Person>) =>
  http<Person>(`/people/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch }),
  });

export const createPerson = (person: Person) =>
  http<Person>("/people", { method: "POST", body: JSON.stringify(person) });
