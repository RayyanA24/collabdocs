import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ImportError } from "./import";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wrap a route handler so thrown errors become consistent JSON responses. */
export async function respond(fn: () => Promise<unknown>, status = 200) {
  try {
    const body = await fn();
    return NextResponse.json(body ?? { ok: true }, { status });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof ImportError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}
