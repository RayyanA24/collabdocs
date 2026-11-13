import { requireUserApi } from "@/lib/auth";
import { createDocument, listDocuments } from "@/lib/documents";
import { readJson, respond } from "@/lib/http";

export async function GET() {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    return listDocuments(supabase, user.id);
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    const body = (await readJson(request)) as { title?: string };
    return createDocument(supabase, user.id, { title: body?.title });
  }, 201);
}
