import Link from "next/link";
import type { DocumentSummary } from "@/lib/documents";

const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function DocumentList({
  title, docs, empty, showOwner,
}: { title: string; docs: DocumentSummary[]; empty: string; showOwner?: boolean }) {
  return (
    <section aria-labelledby={title}>
      <h2 id={title} className="mb-3 text-lg font-semibold">{title}</h2>
      {docs.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-paper/60 p-6 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-paper">
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={`/documents/${d.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-desk">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.title}</span>
                  {showOwner && <span className="block truncate text-xs text-muted">Shared by {d.owner_email ?? "unknown"}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  {d.role && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                      {d.role === "editor" ? "Can edit" : "View only"}
                    </span>
                  )}
                  <time dateTime={d.updated_at}>{fmt.format(new Date(d.updated_at))} UTC</time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
