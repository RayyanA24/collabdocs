import { requireUserApi } from "@/lib/auth";
import { deleteDocument, getAccess, updateDocument } from "@/lib/documents";
import { readJson, respond } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    const { doc, role } = await getAccess(supabase, user.id, (await params).id);
    return { document: doc, role };
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    return updateDocument(supabase, user.id, (await params).id, await readJson(request));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    await deleteDocument(supabase, user.id, (await params).id);
  });
}
