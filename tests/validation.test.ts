import { describe, expect, it } from "vitest";
import { createDocumentSchema, credentialsSchema, shareSchema, updateDocumentSchema } from "@/lib/validation";

describe("validation", () => {
  it("trims titles and rejects blank or oversized ones", () => {
    expect(updateDocumentSchema.parse({ title: "  Hello  " }).title).toBe("Hello");
    expect(updateDocumentSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createDocumentSchema.safeParse({ title: "x".repeat(201) }).success).toBe(false);
  });
  it("requires at least one field to update", () => {
    expect(updateDocumentSchema.safeParse({}).success).toBe(false);
    expect(updateDocumentSchema.safeParse({ content: "<p>hi</p>" }).success).toBe(true);
  });
  it("rejects oversized content", () => {
    expect(updateDocumentSchema.safeParse({ content: "a".repeat(500_001) }).success).toBe(false);
  });
  it("normalizes share emails and restricts roles", () => {
    expect(shareSchema.parse({ email: "  Bob@Example.COM ", role: "editor" })).toEqual({
      email: "bob@example.com",
      role: "editor",
    });
    expect(shareSchema.safeParse({ email: "nope", role: "viewer" }).success).toBe(false);
    expect(shareSchema.safeParse({ email: "a@b.co", role: "owner" }).success).toBe(false);
  });
  it("requires 8+ char passwords", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "longenough" }).success).toBe(true);
  });
});
