import * as cheerio from "cheerio";

export type WelcomeAlert = {
  variant: "danger" | "warning" | "info" | "success";
  heading: string;
  body: string;
};

export type WelcomeData = {
  /** e.g. "DOE, JANE" */
  name: string | null;
  greeting: string | null;
  alerts: WelcomeAlert[];
};

/**
 * Parse the server-rendered dashboard (services/welcome):
 * - greeting card: "Good Afternoon <NAME> and Welcome To Student Self Service!"
 * - alert boxes: only the ones visible without JS (no inline display:none)
 */
export function parseWelcome(html: string): WelcomeData {
  const $ = cheerio.load(html);
  const out: WelcomeData = { name: null, greeting: null, alerts: [] };

  $("h4, h3").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (/Welcome To Student Self Service/i.test(text)) {
      out.greeting = text;
      const m = text.match(
        /Good (?:Morning|Afternoon|Evening)\s+(.+?)\s+and Welcome/i,
      );
      if (m) out.name = m[1].trim();
    }
  });

  $("div.alert").each((_, el) => {
    const style = ($(el).attr("style") ?? "").toLowerCase();
    if (style.includes("display:none") || style.includes("display: none")) {
      return; // JS-driven alerts are not visible for this session
    }
    const cls = $(el).attr("class") ?? "";
    const variant = /alert-danger/.test(cls)
      ? "danger"
      : /alert-warning/.test(cls)
        ? "warning"
        : /alert-success/.test(cls)
          ? "success"
          : "info";
    const heading = $(el).find(".alert-heading").first().text().replace(/\s+/g, " ").trim();
    let body = "";
    $(el)
      .find("p")
      .each((__, p) => {
        const t = $(p).text().replace(/\s+/g, " ").trim();
        if (t) body += (body ? " " : "") + t;
      });
    if (!body) body = $(el).clone().children().remove().end().text().replace(/\s+/g, " ").trim();
    if (heading || body) out.alerts.push({ variant, heading, body });
  });

  return out;
}
