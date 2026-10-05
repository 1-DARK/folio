import type { ID, Teamspace } from "src/types";
import { http } from "./client";
import { supabase } from "./supabase-client";

/** Deletes a teamspace AND every page in it (owners only, server-side).
 *  `deleteTeamspace` below removes only the record — use it just to roll
 *  back a half-created teamspace. */
export async function deleteTeamspaceWithPages(id: ID): Promise<void> {
  const { error } = await supabase.rpc("delete_teamspace", { ts_id: id });
  if (error) throw new Error(error.message);
}

/** Moves a teamspace, with all its pages and rooms, to another workspace the
 *  caller owns (teamspace owners only, server-side). */
export async function moveTeamspaceToWorkspace(
  id: ID,
  workspaceId: ID,
): Promise<void> {
  const { error } = await supabase.rpc("move_teamspace", {
    ts_id: id,
    target_ws_id: workspaceId,
  });
  if (error) throw new Error(error.message);
}

export const fetchTeamspaces = () => http<Teamspace[]>("/teamspaces");

export const fetchTeamspace = (id: ID) => http<Teamspace>(`/teamspaces/${id}`);

export const deleteTeamspace = (id: ID) =>
  http<void>(`/teamspaces/${id}`, { method: "DELETE" });

export const patchTeamspace = (id: ID, patch: Partial<Teamspace>) =>
  http<Teamspace>(`/teamspaces/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch }),
  });

export const createTeamspace = (teamspace: Teamspace) =>
  http<Teamspace>("/teamspaces", {
    method: "POST",
    body: JSON.stringify(teamspace),
  });
