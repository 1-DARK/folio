import type { ID, Page } from "src/types";
import { http, keysToCamel } from "./client";
import { supabase } from "./supabase-client";

// No workspace filter: pages_select RLS defines exactly the readable set —
// your current workspace's pages (that you own or can read) plus pages of
// teamspaces you're a member of in other people's workspaces. Filtering by
// workspace_id here would drop the joined-teamspace pages.
export const fetchPages = () => http<Page[]>("/pages");

export const fetchPage = (id: ID) => http<Page>(`/pages/${id}`);

/**
 * A page by id, including one shared with you from another workspace (a
 * link, an invite). The normal read only covers your current workspace and
 * your teamspaces; when it finds nothing, get_accessible_page (migration 040)
 * returns the page if you have any role on it. Null when you don't.
 */
export async function fetchPageOrShared(id: ID): Promise<Page | null> {
  const own = await fetchPage(id);
  if (own) return own;
  const { data, error } = await supabase.rpc("get_accessible_page", {
    p_id: id,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (keysToCamel(row) as Page) : null;
}

export const patchPage = (id: ID, patch: Partial<Page>) =>
  http<Page>(`/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const deletePage = (id: ID) =>
  http<void>(`/pages/${id}`, { method: "DELETE" });

export const createPage = (page: Page) =>
  http<Page>("/pages", { method: "POST", body: JSON.stringify(page) });
