import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ID, MemberRole } from "src/types";
import { queryKeys } from "src/lib/queryKeys";
import {
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  fetchMyWorkspaceInvites,
  fetchSentWorkspaceInvites,
  fetchWorkspaceInviteLink,
  inviteToWorkspace,
  regenerateWorkspaceInviteLink,
  removeWorkspaceMember,
  revokeWorkspaceInvite,
  setWorkspaceInviteLinkEnabled,
  setWorkspaceMemberRole,
} from "src/api/workspace-members";
import { useCurrentPerson } from "./use-session";
import { useCurrentWorkspace } from "./use-workspaces";
import { useSwitchWorkspace } from "./use-workspace-switch";

export const workspaceInviteKeys = {
  mine: (email: string) => ["workspace-invites", "mine", email] as const,
  sent: (workspaceId: ID) =>
    ["workspace-invites", "sent", workspaceId] as const,
  link: (workspaceId: ID) => ["workspace-invite-link", workspaceId] as const,
};

// ── Invites addressed to you ────────────────────────────────────────────

/** Pending invites to other people's workspaces, for your email. */
export function useMyWorkspaceInvites() {
  const { person } = useCurrentPerson();
  const email = person?.email ?? "";
  return useQuery({
    queryKey: workspaceInviteKeys.mine(email),
    queryFn: () => fetchMyWorkspaceInvites(email),
    enabled: !!email,
    refetchOnWindowFocus: true,
  });
}

/** Accept → join the workspace, then switch into it. */
export function useAcceptWorkspaceInvite() {
  const qc = useQueryClient();
  const switchWorkspace = useSwitchWorkspace();
  return useMutation({
    mutationFn: async (inviteId: ID) => {
      const workspaceId = await acceptWorkspaceInvite(inviteId);
      await switchWorkspace.mutateAsync(workspaceId);
      return workspaceId;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["workspace-invites"] });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export function useDeclineWorkspaceInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: ID) => declineWorkspaceInvite(inviteId),
    onSettled: () => qc.invalidateQueries({ queryKey: ["workspace-invites"] }),
  });
}

// ── Owner: invites you've sent, the invite link, members ────────────────

export function useSentWorkspaceInvites() {
  const { workspaceId } = useCurrentWorkspace();
  const { person } = useCurrentPerson();
  return useQuery({
    queryKey: workspaceInviteKeys.sent(workspaceId ?? ""),
    queryFn: () => fetchSentWorkspaceInvites(workspaceId!),
    enabled: !!workspaceId && person?.role === "owner",
  });
}

export function useInviteToWorkspace() {
  const qc = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: ({
      email,
      role,
    }: {
      email: string;
      role: "member" | "guest";
    }) => {
      if (!workspaceId) throw new Error("No workspace");
      return inviteToWorkspace(workspaceId, email, role);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["workspace-invites"] }),
  });
}

export function useRevokeWorkspaceInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: ID) => revokeWorkspaceInvite(inviteId),
    onSettled: () => qc.invalidateQueries({ queryKey: ["workspace-invites"] }),
  });
}

export function useWorkspaceInviteLink() {
  const { workspaceId } = useCurrentWorkspace();
  const { person } = useCurrentPerson();
  return useQuery({
    queryKey: workspaceInviteKeys.link(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceInviteLink(workspaceId!),
    enabled: !!workspaceId && person?.role === "owner",
  });
}

export function useSetInviteLinkEnabled() {
  const qc = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: (enabled: boolean) => {
      if (!workspaceId) throw new Error("No workspace");
      return setWorkspaceInviteLinkEnabled(workspaceId, enabled);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: workspaceInviteKeys.link(workspaceId ?? ""),
      }),
  });
}

export function useRegenerateInviteLink() {
  const qc = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: () => {
      if (!workspaceId) throw new Error("No workspace");
      return regenerateWorkspaceInviteLink(workspaceId);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: workspaceInviteKeys.link(workspaceId ?? ""),
      }),
  });
}

export function useSetMemberRole() {
  const qc = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: ({ personId, role }: { personId: ID; role: MemberRole }) => {
      if (!workspaceId) throw new Error("No workspace");
      return setWorkspaceMemberRole(workspaceId, personId, role);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.people.all });
    },
  });
}

/** Remove someone (owners). */
export function useRemoveMember() {
  const qc = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  return useMutation({
    mutationFn: (personId: ID) => {
      if (!workspaceId) throw new Error("No workspace");
      return removeWorkspaceMember(workspaceId, personId);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.people.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
