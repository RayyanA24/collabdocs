import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "./http";
import { canEdit, canManage, resolveRole, type Role, type ShareRole } from "./permissions";
import { sanitizeContent } from "./sanitize";
import {
  createDocumentSchema,
  idSchema,
  removeShareSchema,
  shareSchema,
  updateDocumentSchema,
} from "./validation";

export type DocumentRow = {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  updated_at: string;
  owner_email?: string;
  role?: ShareRole;
};

export type ShareEntry = { user_id: string; email: string; role: ShareRole };

/** Load a document plus the caller's role. Throws 404 when the caller has no access. */
export async function getAccess(
  supabase: SupabaseClient,
  userId: string,
  rawId: string,
): Promise<{ doc: DocumentRow; role: Role }> {
  const id = idSchema.safeParse(rawId);
  if (!id.success) throw new HttpError(404, "Document not found");

  const { data: doc } = await supabase.from("documents").select("*").eq("id", id.data).maybeSingle();
  if (!doc) throw new HttpError(404, "Document not found");

  const { data: share } = await supabase
    .from("document_shares")
    .select("role")
    .eq("document_id", id.data)
    .eq("user_id", userId)
    .maybeSingle();

  const role = resolveRole({ ownerId: doc.owner_id, userId, shareRole: share?.role as ShareRole | undefined });
  if (!role) throw new HttpError(404, "Document not found"); // don't reveal existence
  return { doc: doc as DocumentRow, role };
}

export async function listDocuments(supabase: SupabaseClient, userId: string) {
  const { data: owned, error } = await supabase
    .from("documents")
    .select("id,title,updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const { data: shares, error: sharedError } = await supabase
    .from("document_shares")
    .select("role, documents(id,title,updated_at, owner:profiles!documents_owner_id_fkey(email))")
    .eq("user_id", userId);
  if (sharedError) throw sharedError;

  type SharedJoin = {
    role: ShareRole;
    documents: { id: string; title: string; updated_at: string; owner: { email: string } | null } | null;
  };
  const shared: DocumentSummary[] = ((shares ?? []) as unknown as SharedJoin[])
    .filter((s) => s.documents)
    .map((s) => ({
      id: s.documents!.id,
      title: s.documents!.title,
      updated_at: s.documents!.updated_at,
      owner_email: s.documents!.owner?.email,
      role: s.role,
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return { owned: (owned ?? []) as DocumentSummary[], shared };
}

export async function createDocument(
  supabase: SupabaseClient,
  userId: string,
  input: { title?: string; content?: string },
) {
  const parsed = createDocumentSchema.parse({ title: input.title });

  // The id is generated here and the insert deliberately does NOT chain .select().
  // INSERT ... RETURNING also evaluates the SELECT policy on the new row, and that policy's
  // doc_role() helper (STABLE, reads public.documents) cannot see a row inserted by the same
  // statement, which fails with 42501 even though the INSERT policy passed.
  const id = randomUUID();
  const { error } = await supabase.from("documents").insert({
    id,
    owner_id: userId, // always the authenticated user; RLS WITH CHECK enforces this too
    ...(parsed.title ? { title: parsed.title } : {}),
    content: sanitizeContent(input.content ?? ""),
  });
  if (error) throw error;
  return { id };
}

export async function updateDocument(supabase: SupabaseClient, userId: string, id: string, raw: unknown) {
  const patch = updateDocumentSchema.parse(raw);
  const { role } = await getAccess(supabase, userId, id);
  if (!canEdit(role)) throw new HttpError(403, "You have view-only access to this document");

  const { data, error } = await supabase
    .from("documents")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.content !== undefined ? { content: sanitizeContent(patch.content) } : {}),
    })
    .eq("id", id)
    .select("updated_at")
    .single();
  if (error) throw error;
  return { updated_at: data.updated_at as string };
}

export async function deleteDocument(supabase: SupabaseClient, userId: string, id: string) {
  const { role } = await getAccess(supabase, userId, id);
  if (!canManage(role)) throw new HttpError(403, "Only the owner can delete this document");
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function listShares(supabase: SupabaseClient, userId: string, id: string): Promise<ShareEntry[]> {
  const { role } = await getAccess(supabase, userId, id);
  if (!canManage(role)) throw new HttpError(403, "Only the owner can manage sharing");
  const { data, error } = await supabase
    .from("document_shares")
    .select("user_id, role, profile:profiles!document_shares_user_id_fkey(email)")
    .eq("document_id", id)
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as unknown as { user_id: string; role: ShareRole; profile: { email: string } | null }[]).map(
    (s) => ({ user_id: s.user_id, role: s.role, email: s.profile?.email ?? "unknown" }),
  );
}

export async function upsertShare(supabase: SupabaseClient, userId: string, id: string, raw: unknown) {
  const input = shareSchema.parse(raw);
  const { role } = await getAccess(supabase, userId, id);
  if (!canManage(role)) throw new HttpError(403, "Only the owner can manage sharing");

  const { data: found, error: findError } = await supabase.rpc("find_profile_by_email", { p_email: input.email });
  if (findError) throw findError;
  const target = (found as { id: string; email: string }[] | null)?.[0];
  if (!target) throw new HttpError(404, "No CollabDocs user has that email. Ask them to sign up first.");
  if (target.id === userId) throw new HttpError(400, "You already own this document");

  const { error } = await supabase
    .from("document_shares")
    .upsert({ document_id: id, user_id: target.id, role: input.role }, { onConflict: "document_id,user_id" });
  if (error) throw error;
  return { user_id: target.id, email: target.email, role: input.role };
}

export async function removeShare(supabase: SupabaseClient, userId: string, id: string, raw: unknown) {
  const { userId: targetId } = removeShareSchema.parse(raw);
  const { role } = await getAccess(supabase, userId, id);
  if (!canManage(role)) throw new HttpError(403, "Only the owner can manage sharing");
  const { error } = await supabase.from("document_shares").delete().eq("document_id", id).eq("user_id", targetId);
  if (error) throw error;
}
