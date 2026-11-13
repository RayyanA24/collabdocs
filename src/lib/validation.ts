import { z } from "zod";

export const MAX_CONTENT_CHARS = 500_000;
export const MAX_IMPORT_BYTES = 1_000_000;

export const idSchema = z.uuid();

const title = z.string().trim().min(1, "Title is required").max(200, "Title is too long");

export const createDocumentSchema = z.object({
  title: title.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: title.optional(),
    content: z.string().max(MAX_CONTENT_CHARS, "Document is too large").optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Nothing to update",
  });

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(["viewer", "editor"]),
});

export const removeShareSchema = z.object({ userId: idSchema });

export const credentialsSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
