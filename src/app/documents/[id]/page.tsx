import { Suspense } from "react";
import { notFound } from "next/navigation";
import Editor from "@/components/Editor";
import { requireUserPage } from "@/lib/auth";
import { getAccess } from "@/lib/documents";
import { HttpError } from "@/lib/http";

export default function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Opening document…</p>}>
      <DocumentView params={params} />
    </Suspense>
  );
}

async function DocumentView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUserPage();

  let access;
  try {
    access = await getAccess(supabase, user.id, id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }

  let ownerEmail: string | undefined;
  if (access.role !== "owner") {
    const { data } = await supabase.from("profiles").select("email").eq("id", access.doc.owner_id).maybeSingle();
    ownerEmail = data?.email;
  }

  return (
    <Editor key={id} id={id} initialTitle={access.doc.title} initialContent={access.doc.content}
      role={access.role} ownerEmail={ownerEmail} />
  );
}
