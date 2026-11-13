import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-line bg-paper p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold">CollabDocs</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Sign in to write, import and share documents.</p>
        <AuthForm />
      </div>
    </main>
  );
}
