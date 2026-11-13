"use client";

import { useEffect, useState } from "react";
import { btn, btnPrimary, input } from "./ui";
import type { ShareEntry } from "@/lib/documents";
import type { ShareRole } from "@/lib/permissions";

export default function SharePanel({ documentId }: { documentId: string }) {
  const base = `/api/documents/${documentId}/shares`;
  const [shares, setShares] = useState<ShareEntry[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(base)
      .then(async (res) => ({ ok: res.ok, body: await res.json() }))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (ok) setShares(body.shares);
        else setError(body.error ?? "Could not load collaborators");
      })
      .catch(() => !cancelled && setError("Could not load collaborators"));
    return () => { cancelled = true; };
  }, [base, reloadKey]);

  async function call(method: "POST" | "DELETE", payload: object) {
    setBusy(true);
    setError(null);
    const res = await fetch(base, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) setError(body.error ?? "Request failed");
    else setReloadKey((k) => k + 1);
    setBusy(false);
    return res.ok;
  }

  return (
    <section aria-label="Sharing" className="mb-5 space-y-4 rounded-md border border-line bg-paper p-4">
      <h2 className="font-semibold">Share this document</h2>
      <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
        e.preventDefault();
        if (await call("POST", { email, role })) setEmail("");
      }}>
        <label className="sr-only" htmlFor="share-email">Collaborator email</label>
        <input id="share-email" type="email" required placeholder="colleague@example.com"
          className={`${input} min-w-56 flex-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="sr-only" htmlFor="share-role">Permission</label>
        <select id="share-role" className={`${input} w-auto`} value={role}
          onChange={(e) => setRole(e.target.value as ShareRole)}>
          <option value="viewer">Can view</option>
          <option value="editor">Can edit</option>
        </select>
        <button className={btnPrimary} disabled={busy}>Share</button>
      </form>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {shares === null ? (
        <p className="text-sm text-muted">Loading collaborators…</p>
      ) : shares.length === 0 ? (
        <p className="text-sm text-muted">Not shared with anyone yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {shares.map((s) => (
            <li key={s.user_id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="truncate">{s.email}</span>
              <span className="flex items-center gap-2">
                <select aria-label={`Permission for ${s.email}`} className={`${input} w-auto`} value={s.role} disabled={busy}
                  onChange={(e) => call("POST", { email: s.email, role: e.target.value })}>
                  <option value="viewer">Can view</option>
                  <option value="editor">Can edit</option>
                </select>
                <button className={btn} disabled={busy} onClick={() => call("DELETE", { userId: s.user_id })}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
