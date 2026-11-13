import { describe, expect, it } from "vitest";
import { ImportError, importToHtml } from "@/lib/import";
import { sanitizeContent } from "@/lib/sanitize";

describe("importToHtml", () => {
  it("turns text into paragraphs, preserving line breaks and escaping HTML", () => {
    const { title, html } = importToHtml("notes.txt", "First line\nsecond line\n\nNext <b>para</b>");
    expect(title).toBe("notes");
    expect(html).toBe("<p>First line<br />second line</p><p>Next &lt;b&gt;para&lt;/b&gt;</p>");
  });
  it("renders markdown headings, emphasis and lists", () => {
    const { html } = importToHtml("Plan.md", "# Title\n\nSome **bold** and *italic*\n\n- a\n- b\n\n1. one\n2. two");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
  });
  it("strips scripts and event handlers from markdown", () => {
    const { html } = importToHtml("x.md", 'Hi <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toMatch(/script|onerror|<img/i);
  });
  it("handles CRLF and BOM", () => {
    expect(importToHtml("a.txt", "\uFEFFone\r\n\r\ntwo").html).toBe("<p>one</p><p>two</p>");
  });
  it("rejects unsupported, empty, binary and oversized files", () => {
    expect(() => importToHtml("a.pdf", "x")).toThrow(ImportError);
    expect(() => importToHtml("a.txt", "   \n ")).toThrow("empty");
    expect(() => importToHtml("a.txt", "ab\u0000cd")).toThrow(ImportError);
    expect(() => importToHtml("a.txt", "x", 1_000_001)).toThrow("1 MB");
  });
});

describe("sanitizeContent", () => {
  it("keeps editor formatting and drops everything else", () => {
    const out = sanitizeContent('<h2>Hi</h2><p><strong>b</strong><u>u</u><a href="javascript:x">l</a></p><script>x</script>');
    expect(out).toBe("<h2>Hi</h2><p><strong>b</strong><u>u</u>l</p>");
  });
});
