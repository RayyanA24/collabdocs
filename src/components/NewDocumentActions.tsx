"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { btn, btnPrimary } from "./ui";

export default function NewDocumentActions() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, init);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Request failed");
      router.push(`/documents/${body.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button className={btnPrimary} disabled={busy}
          onClick={() => send("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          })}>
          New document
        </button>
        <button className={btn} disabled={busy} onClick={() => fileRef.current?.click()}>
          Import .txt / .md
        </button>
        <input ref={fileRef} type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const form = new FormData();
            form.append("file", file);
            send("/api/documents/import", { method: "POST", body: form });
          }} />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
