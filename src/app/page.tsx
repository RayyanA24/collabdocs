import { Suspense } from "react";
import DocumentList from "@/components/DocumentList";
import NewDocumentActions from "@/components/NewDocumentActions";
import SignOutButton from "@/components/SignOutButton";
import { requireUserPage } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";

export default function Home() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading your documents…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const { supabase, user } = await requireUserPage();
  const { owned, shared } = await listDocuments(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">CollabDocs</h1>
          <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <SignOutButton />
        </div>
      </header>
      <div className="flex justify-end"><NewDocumentActions /></div>
      <DocumentList title="My documents" docs={owned}
        empty="You haven't written anything yet. Create a document or import a .txt or .md file." />
      <DocumentList title="Shared with me" docs={shared} showOwner
        empty="Nothing has been shared with you yet." />
    </main>
  );
}
