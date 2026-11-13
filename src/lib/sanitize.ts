import sanitizeHtml from "sanitize-html";

/** Allow only the markup the editor can produce. Applied to every write on the server. */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "strong", "em", "u", "s",
      "ul", "ol", "li", "blockquote", "code", "pre", "hr",
    ],
    allowedAttributes: {},
  });
}
