import { requireUserApi } from "@/lib/auth";
import { listShares, removeShare, upsertShare } from "@/lib/documents";
import { readJson, respond } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    return { shares: await listShares(supabase, user.id, (await params).id) };
  });
}

/** Create a share, or change an existing collaborator's role. */
export async function POST(request: Request, { params }: Ctx) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    return upsertShare(supabase, user.id, (await params).id, await readJson(request));
  });
}

export async function DELETE(request: Request, { params }: Ctx) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    await removeShare(supabase, user.id, (await params).id, await readJson(request));
  });
}
