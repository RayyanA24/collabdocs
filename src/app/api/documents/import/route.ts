import { requireUserApi } from "@/lib/auth";
import { createDocument } from "@/lib/documents";
import { HttpError, respond } from "@/lib/http";
import { importToHtml } from "@/lib/import";
import { MAX_IMPORT_BYTES } from "@/lib/validation";

export async function POST(request: Request) {
  return respond(async () => {
    const { supabase, user } = await requireUserApi();
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Attach a .txt or .md file");
    if (file.size > MAX_IMPORT_BYTES) throw new HttpError(400, "File is larger than 1 MB");

    const { title, html } = importToHtml(file.name, await file.text(), file.size);
    return createDocument(supabase, user.id, { title, content: html });
  }, 201);
}
