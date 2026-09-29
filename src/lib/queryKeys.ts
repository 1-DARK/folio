import type { ID } from "../types";

export const queryKeys = {
  pages: {
    all: ["pages"] as const,
    // No workspace: every workspace's list (a prefix key, for invalidating
    // or patching all of them at once).
    lists: (workspaceId?: ID) =>
      workspaceId
        ? ([...queryKeys.pages.all, "list", workspaceId] as const)
        : ([...queryKeys.pages.all, "list"] as const),
    detail: (id: ID) => [...queryKeys.pages.all, "detail", id] as const,
  },
  threads: {
    all: ["threads"] as const,
    lists: () => [...queryKeys.threads.all, "list"] as const,
    byPage: (pageId: ID) => [...queryKeys.threads.lists(), { pageId }] as const,
    detail: (id: ID) => [...queryKeys.threads.all, "detail", id] as const,
  },
  comments: {
    all: ["comments"] as const,
    lists: () => [...queryKeys.comments.all, "list"] as const,
    byThread: (threadId: ID) =>
      [...queryKeys.comments.lists(), { threadId }] as const,
    detail: (id: ID) => [...queryKeys.comments.all, "detail", id] as const,
  },
  versions: {
    all: ["versions"] as const,
    lists: () => [...queryKeys.versions.all, "list"],
    byPage: (pageId: ID) =>
      [...queryKeys.versions.lists(), { pageId }] as const,
    detail: (id: ID) => [...queryKeys.versions.all, "detail", id] as const,
  },
  people: {
    all: ["people"] as const,
    // No workspace: every workspace's list (a prefix key, for invalidating
    // or patching all of them at once).
    lists: (workspaceId?: ID) =>
      workspaceId
        ? ([...queryKeys.people.all, "list", workspaceId] as const)
        : ([...queryKeys.people.all, "list"] as const),
    detail: (id: ID) => [...queryKeys.people.all, "detail", id] as const,
  },

  groups: {
    all: ["groups"] as const,
    // No workspace: every workspace's list (a prefix key, for invalidating
    // or patching all of them at once).
    lists: (workspaceId?: ID) =>
      workspaceId
        ? ([...queryKeys.groups.all, "list", workspaceId] as const)
        : ([...queryKeys.groups.all, "list"] as const),
    detail: (id: ID) => [...queryKeys.groups.all, "detail", id] as const,
  },

  teamspaces: {
    all: ["teamspaces"] as const,
    // No workspace: every workspace's list (a prefix key, for invalidating
    // or patching all of them at once).
    lists: (workspaceId?: ID) =>
      workspaceId
        ? ([...queryKeys.teamspaces.all, "list", workspaceId] as const)
        : ([...queryKeys.teamspaces.all, "list"] as const),
    detail: (id: ID) => [...queryKeys.teamspaces.all, "detail", id] as const,
  },
  workspaces: {
    all: ["workspaces"] as const,
    lists: () => [...queryKeys.workspaces.all, "list"] as const,
    detail: (id: ID) => [...queryKeys.workspaces.all, "detail", id] as const,
  },
  pageAccess: {
    all: ["pageAccess"] as const,
    list: (pageId: ID) =>
      [...queryKeys.pageAccess.all, "list", pageId] as const,
  },
  dataSources: {
    all: ["dataSources"] as const,
    lists: () => [...queryKeys.dataSources.all, "list"] as const,
    detail: (id: ID) => [...queryKeys.dataSources.all, "detail", id] as const,
  },
} as const;
