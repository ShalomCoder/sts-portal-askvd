import * as cheerio from "cheerio";

/**
 * Strip scripts/styles/handlers from upstream-supplied HTML fragments
 * (FAQ answers, notification bodies) before rendering them.
 */
export function sanitizeFragment(html: string): string {
  const $ = cheerio.load(`<div id="root">${html}</div>`);
  $("#root")
    .find("script, style, iframe, object, embed, form, link, meta")
    .remove();
  $("#root")
    .find("*")
    .each((_, el) => {
      const attribs = (el as unknown as { attribs?: Record<string, string> })
        .attribs;
      if (!attribs) return;
      for (const name of Object.keys(attribs)) {
        if (/^on/i.test(name)) $(el).removeAttr(name);
        if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attribs[name])) {
          $(el).removeAttr(name);
        }
      }
    });
  // Force external links to open in a new tab.
  $("#root a").attr("target", "_blank").attr("rel", "noopener noreferrer");
  return $("#root").html() ?? "";
}
