"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema } from "@/lib/validation";
import { btnPrimary, input } from "./ui";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setBusy(true);
    const supabase = createClient();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) setError(error.message);
      else {
        router.replace("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp(parsed.data);
      if (error) setError(error.message);
      else if (data.session) {
        router.replace("/");
        router.refresh();
      } else setNotice("Account created. Check your email to confirm it, then sign in.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" type="email" autoComplete="email" className={input} value={email}
          onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" type="password" className={input} value={password}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="text-sm text-accent">{notice}</p>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <button type="button" className="w-full text-sm text-muted underline"
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}>
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
