import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteDocument, getAccess, listDocuments, listShares, removeShare, updateDocument, upsertShare,
} from "@/lib/documents";
import { HttpError } from "@/lib/http";

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const DOC_ID = "33333333-3333-4333-8333-333333333333";
const doc = { id: DOC_ID, owner_id: OWNER, title: "T", content: "", created_at: "", updated_at: "" };

type Opts = { doc?: typeof doc | null; share?: { role: string } | null; profile?: { id: string; email: string } | null };

/** Minimal chainable stand-in for the Supabase client that records writes. */
function fake(opts: Opts) {
  const writes: { table: string; op: string; payload?: unknown }[] = [];
  const selects: string[] = [];
  const client = {
    from(table: string) {
      const b: Record<string, unknown> = {};
      const chain = () => b;
      Object.assign(b, {
        select: (cols?: string) => (selects.push(`${table}:${cols ?? "*"}`), b),
        eq: chain, order: chain,
        insert: (p: unknown) => (writes.push({ table, op: "insert", payload: p }), b),
        update: (p: unknown) => (writes.push({ table, op: "update", payload: p }), b),
        upsert: (p: unknown) => (writes.push({ table, op: "upsert", payload: p }), b),
        delete: () => (writes.push({ table, op: "delete" }), b),
        maybeSingle: async () => ({ data: table === "documents" ? (opts.doc ?? null) : (opts.share ?? null), error: null }),
        single: async () => ({ data: { id: DOC_ID, updated_at: "now" }, error: null }),
        then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
      });
      return b;
    },
    rpc: async () => ({ data: opts.profile ? [opts.profile] : [], error: null }),
  };
  return { supabase: client as unknown as SupabaseClient, writes, selects };
}

const status = async (p: Promise<unknown>) => {
  try { await p; return 200; } catch (e) { return e instanceof HttpError ? e.status : (e as Error).name; }
};

describe("getAccess", () => {
  it("returns owner / editor / viewer roles", async () => {
    expect((await getAccess(fake({ doc }).supabase, OWNER, DOC_ID)).role).toBe("owner");
    expect((await getAccess(fake({ doc, share: { role: "editor" } }).supabase, OTHER, DOC_ID)).role).toBe("editor");
    expect((await getAccess(fake({ doc, share: { role: "viewer" } }).supabase, OTHER, DOC_ID)).role).toBe("viewer");
  });
  it("404s for strangers, missing docs and malformed ids", async () => {
    expect(await status(getAccess(fake({ doc }).supabase, OTHER, DOC_ID))).toBe(404);
    expect(await status(getAccess(fake({ doc: null }).supabase, OWNER, DOC_ID))).toBe(404);
    expect(await status(getAccess(fake({ doc }).supabase, OWNER, "not-a-uuid"))).toBe(404);
  });
});

describe("updateDocument", () => {
  it("lets owners and editors write", async () => {
    const a = fake({ doc });
    expect(await status(updateDocument(a.supabase, OWNER, DOC_ID, { title: "New" }))).toBe(200);
    expect(a.writes).toHaveLength(1);
    const b = fake({ doc, share: { role: "editor" } });
    expect(await status(updateDocument(b.supabase, OTHER, DOC_ID, { content: "<p>x</p>" }))).toBe(200);
  });
  it("forbids viewers and never reaches the database", async () => {
    const f = fake({ doc, share: { role: "viewer" } });
    expect(await status(updateDocument(f.supabase, OTHER, DOC_ID, { title: "Hack" }))).toBe(403);
    expect(f.writes).toHaveLength(0);
  });
  it("404s for users without access", async () => {
    const f = fake({ doc });
    expect(await status(updateDocument(f.supabase, OTHER, DOC_ID, { title: "Hack" }))).toBe(404);
    expect(f.writes).toHaveLength(0);
  });
  it("rejects invalid input before touching the database", async () => {
    const f = fake({ doc });
    expect(await status(updateDocument(f.supabase, OWNER, DOC_ID, { title: "" }))).toBe("ZodError");
    expect(f.writes).toHaveLength(0);
  });
  it("sanitizes content before saving", async () => {
    const f = fake({ doc });
    await updateDocument(f.supabase, OWNER, DOC_ID, { content: "<p>ok</p><script>x</script>" });
    expect(f.writes[0].payload).toEqual({ content: "<p>ok</p>" });
  });
});

describe("owner-only actions", () => {
  const editor = () => fake({ doc, share: { role: "editor" } });
  const viewer = () => fake({ doc, share: { role: "viewer" } });

  it("blocks editors and viewers from deleting", async () => {
    for (const f of [editor(), viewer()]) {
      expect(await status(deleteDocument(f.supabase, OTHER, DOC_ID))).toBe(403);
      expect(f.writes).toHaveLength(0);
    }
    expect(await status(deleteDocument(fake({ doc }).supabase, OWNER, DOC_ID))).toBe(200);
  });
  it("blocks editors and viewers from listing, adding or removing shares", async () => {
    for (const f of [editor(), viewer()]) {
      expect(await status(listShares(f.supabase, OTHER, DOC_ID))).toBe(403);
      expect(await status(upsertShare(f.supabase, OTHER, DOC_ID, { email: "a@b.co", role: "editor" }))).toBe(403);
      expect(await status(removeShare(f.supabase, OTHER, DOC_ID, { userId: OWNER }))).toBe(403);
      expect(f.writes).toHaveLength(0);
    }
  });
});

describe("upsertShare", () => {
  it("shares with an existing user", async () => {
    const f = fake({ doc, profile: { id: OTHER, email: "bob@example.com" } });
    const result = await upsertShare(f.supabase, OWNER, DOC_ID, { email: "Bob@Example.com", role: "viewer" });
    expect(result).toMatchObject({ user_id: OTHER, role: "viewer" });
    expect(f.writes[0]).toMatchObject({ table: "document_shares", op: "upsert" });
  });
  it("404s for unknown emails, 400s for self-share and bad input", async () => {
    expect(await status(upsertShare(fake({ doc }).supabase, OWNER, DOC_ID, { email: "x@y.co", role: "viewer" }))).toBe(404);
    const self = fake({ doc, profile: { id: OWNER, email: "me@example.com" } });
    expect(await status(upsertShare(self.supabase, OWNER, DOC_ID, { email: "me@example.com", role: "viewer" }))).toBe(400);
    expect(await status(upsertShare(fake({ doc }).supabase, OWNER, DOC_ID, { email: "bad", role: "viewer" }))).toBe("ZodError");
  });
});

describe("PostgREST embeds", () => {
  // documents <-> profiles is ambiguous (owner_id FK, plus document_shares many-to-many),
  // so every embed of profiles must name its relationship explicitly (PGRST201).
  it("disambiguates the owner relationship in the shared-documents query", async () => {
    const f = fake({ doc });
    await listDocuments(f.supabase, OTHER);
    const shared = f.selects.find((s) => s.startsWith("document_shares:"));
    expect(shared).toContain("owner:profiles!documents_owner_id_fkey(email)");
  });
  it("names the relationship when listing collaborators", async () => {
    const f = fake({ doc });
    await listShares(f.supabase, OWNER, DOC_ID);
    expect(f.selects.some((s) => s.includes("profiles!document_shares_user_id_fkey(email)"))).toBe(true);
  });
});
