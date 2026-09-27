import { useQuery } from "@tanstack/react-query";
import type { ID, PageRole } from "src/types";
import { fetchPageRole } from "src/api/page-role";
import { useMemo } from "react";

// The current user's effective role on a page. Cached per page. Returns
// undefined while loading; null if the user has no access at all.
//
// Kept in the cache for the whole session (gcTime: Infinity) so a page you
// already opened stays editable offline — the default 5-minute GC dropped the
// role, the refetch can't run offline, and the editor fell back to read-only.
// staleTime 0 still refetches on every mount while online.
export function usePageRole(pageId: ID | null | undefined) {
  return useQuery({
    queryKey: ["page-role", pageId],
    queryFn: () => fetchPageRole(pageId as ID),
    enabled: !!pageId,
    staleTime: 0,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
  });
}

// ── Capability layer ────────────────────────────────────────────────────────
// Derive concrete capabilities from the role. This is the single place the role
// ladder is interpreted; components ask for capabilities, not raw roles.

export interface PageCapabilities {
  role: PageRole | null;
  canView: boolean;
  canComment: boolean;
  canEditContent: boolean;
  canManageAccess: boolean; // share, change others' roles
  canDeletePage: boolean;
  isLoading: boolean;
}

const RANK: Record<PageRole, number> = {
  view: 1,
  comment: 2,
  edit: 3,
  full: 4,
};

export function capabilitiesFromRole(
  role: PageRole | null | undefined,
  isLoading: boolean,
): PageCapabilities {
  const r = role ?? null;
  const rank = r ? RANK[r] : 0;
  return {
    role: r,
    canView: rank >= RANK.view,
    canComment: rank >= RANK.comment, // comment, edit, full — NOT view
    canEditContent: rank >= RANK.edit, // edit, full — NOT comment/view
    canManageAccess: rank >= RANK.full,
    canDeletePage: rank >= RANK.full,
    isLoading,
  };
}

export function usePageCapabilities(
  pageId: ID | null | undefined,
): PageCapabilities {
  const { data: role, isLoading } = usePageRole(pageId);
  return useMemo(
    () => capabilitiesFromRole(role, isLoading),
    [role, isLoading],
  );
}
