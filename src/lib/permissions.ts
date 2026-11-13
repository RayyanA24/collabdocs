export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "editor" | "viewer";

/** Resolve a user's effective role on a document, or null if they have no access. */
export function resolveRole(input: {
  ownerId: string;
  userId: string;
  shareRole?: ShareRole | null;
}): Role | null {
  if (input.ownerId === input.userId) return "owner";
  return input.shareRole ?? null;
}

export const canView = (role: Role | null): role is Role => role !== null;
export const canEdit = (role: Role | null) => role === "owner" || role === "editor";
export const canManage = (role: Role | null) => role === "owner";
