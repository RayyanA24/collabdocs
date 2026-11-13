import { describe, expect, it } from "vitest";
import { canEdit, canManage, canView, resolveRole } from "@/lib/permissions";

describe("permissions", () => {
  it("owner always resolves to owner, even with a stray share row", () => {
    expect(resolveRole({ ownerId: "a", userId: "a", shareRole: "viewer" })).toBe("owner");
  });
  it("uses the share role for other users", () => {
    expect(resolveRole({ ownerId: "a", userId: "b", shareRole: "editor" })).toBe("editor");
    expect(resolveRole({ ownerId: "a", userId: "b", shareRole: "viewer" })).toBe("viewer");
  });
  it("returns null with no share", () => {
    expect(resolveRole({ ownerId: "a", userId: "b" })).toBeNull();
    expect(resolveRole({ ownerId: "a", userId: "b", shareRole: null })).toBeNull();
  });
  it("capability matrix", () => {
    expect([canView("viewer"), canEdit("viewer"), canManage("viewer")]).toEqual([true, false, false]);
    expect([canView("editor"), canEdit("editor"), canManage("editor")]).toEqual([true, true, false]);
    expect([canView("owner"), canEdit("owner"), canManage("owner")]).toEqual([true, true, true]);
    expect([canView(null), canEdit(null), canManage(null)]).toEqual([false, false, false]);
  });
});
