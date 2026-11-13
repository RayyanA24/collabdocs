import { marked } from "marked";
import { MAX_IMPORT_BYTES } from "./validation";
import { sanitizeContent } from "./sanitize";

export class ImportError extends Error {}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Convert an uploaded .txt / .md file into editor-ready (sanitized) HTML. */
export function importToHtml(
  filename: string,
  text: string,
  byteLength = new TextEncoder().encode(text).length,
): { title: string; html: string } {
  const match = /^(.*)\.(txt|md|markdown)$/i.exec(filename.trim());
  if (!match) throw new ImportError("Only .txt and .md files can be imported");
  if (byteLength > MAX_IMPORT_BYTES) throw new ImportError("File is larger than 1 MB");
  if (text.includes("\u0000")) throw new ImportError("File does not look like text");

  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!normalized.trim()) throw new ImportError("File is empty");

  const isMarkdown = match[2].toLowerCase() !== "txt";
  const html = isMarkdown
    ? (marked.parse(normalized, { async: false, gfm: true }) as string)
    : normalized
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
        .join("");

  const title = (match[1].trim() || "Imported document").slice(0, 200);
  return { title, html: sanitizeContent(html) };
}
