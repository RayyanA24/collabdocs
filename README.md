# CollabDocs

A small collaborative document editor: Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth + Postgres) + Tiptap + Zod + Vitest.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. For quick demos, turn off **Authentication → Providers → Email → Confirm email** (otherwise new accounts must confirm by email before signing in).
4. `cp .env.example .env.local` and fill in the project URL and **anon** key. The service-role key is never used and must not be added.
5. `npm install && npm run dev`, then sign up two accounts to try sharing.

Scripts: `npm run dev`, `npm run build`, `npm test`, `npm run lint`.

## Features

- Create, rename, edit, save (autosave after 1s + explicit **Save**) and reopen documents.
- Formatting: bold, italic, underline, H1–H3, bulleted and numbered lists.
- Import `.txt` / `.md` / `.markdown` (≤ 1 MB) into a new editable document.
- Share by email as **viewer** or **editor**; owner can change a role or remove access.
- Dashboard shows **My documents** and **Shared with me** (with role + owner) separately.

## How permissions are enforced

Two independent layers, neither of which relies on UI visibility:

1. **Server code** (`src/lib/documents.ts`): every route handler authenticates the caller (`supabase.auth.getUser()`), resolves their role with `getAccess()`, and checks `canEdit` / `canManage` before any write. Users with no access get 404 (existence is not revealed); viewers get 403 on writes.
2. **Postgres RLS** (`0001_init.sql`): the same rules as policies, since the server queries as the signed-in user (anon key + user JWT). Even a bug in the server code cannot bypass them.

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| Read | ✓ | ✓ | ✓ |
| Edit title/content | ✓ | ✓ | ✗ |
| Delete, manage sharing | ✓ | ✗ | ✗ |

All input is validated with Zod (`src/lib/validation.ts`); saved HTML is sanitized to the editor's tag set (`src/lib/sanitize.ts`).

## Layout

- `src/app` pages and `api/` route handlers · `src/proxy.ts` session refresh + redirect (Next 16's replacement for middleware)
- `src/lib` permissions, validation, import, sanitize, data layer · `src/components` UI
- `tests/` Vitest suites · `supabase/migrations` schema + RLS

## Known limitations

- Concurrent edits are last-write-wins (no real-time sync, no version history).
- Documents can only be shared with people who already have an account.
- No delete button in the UI (the `DELETE /api/documents/:id` endpoint exists and is owner-only).
- Share lookup reveals whether an email has an account to any signed-in user; add rate limiting before production use.
