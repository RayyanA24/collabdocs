import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { HttpError } from "./http";

/** For pages: redirect to /login when signed out. */
export async function requireUserPage() {
  // The Supabase auth client reads Date.now() to check token expiry. Opt this render into
  // request time first so Next doesn't flag it as an unstable value during prerendering.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, user: { id: data.user.id, email: data.user.email ?? "" } };
}

/** For route handlers: respond 401 when signed out. */
export async function requireUserApi() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new HttpError(401, "Sign in required");
  return { supabase, user: { id: data.user.id, email: data.user.email ?? "" } };
}
