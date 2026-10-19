/**
 * Client-side sanitizer for upstream HTML fragments rendered inside the
 * portal (FAQ answers, notification bodies). Uses DOMParser in the browser
 * — no dependencies — and strips scripts/styles/handlers, mirroring the
 * server-side `sanitizeFragment` rules.
 */
const ALLOWED_TAGS = new Set([
  "P","BR","B","I","U","STRONG","EM","UL","OL","LI","A","H1","H2","H3","H4",
  "H5","H6","SPAN","DIV","TABLE","THEAD","TBODY","TR","TD","TH","BLOCKQUOTE",
  "HR","SUB","SUP","PRE","CODE","SMALL",
]);

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(
    `<div id="root">${html}</div>`,
    "text/html",
  );
  const root = doc.getElementById("root");
  if (!root) return "";

  // Remove disallowed elements entirely (taking their children with them).
  root.querySelectorAll("*").forEach((el) => {
    if (!ALLOWED_TAGS.has(el.tagName)) el.remove();
  });

  // Strip event handlers and dangerous URLs from survivors.
  root.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      else if ((name === "href" || name === "src") && value.startsWith("javascript:"))
        el.removeAttribute(attr.name);
      else if (name === "style") el.removeAttribute(attr.name);
    }
  });

  // External links open in a new tab.
  root.querySelectorAll("a[href]").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  return root.innerHTML;
}
