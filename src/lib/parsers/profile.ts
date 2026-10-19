import * as cheerio from "cheerio";

export type ProfileField = { label: string; value: string };

/**
 * Parse the server-rendered profile page (services/profile).
 * Structure: a table where each row has td.textcolor (label) + td.sty (value).
 * Student photo comes from fetchimage (JSON status only, so we skip it).
 */
export function parseProfile(html: string): {
  fields: ProfileField[];
  photo: string | null;
} {
  const $ = cheerio.load(html);
  const fields: ProfileField[] = [];

  $("tr").each((_, tr) => {
    const label = $(tr).find("td.textcolor").first().text().replace(/\s+/g, " ").trim();
    const value = $(tr).find("td.sty").first().text().replace(/\s+/g, " ").trim();
    if (label) fields.push({ label, value });
  });

  // Fallback: some label/value layouts use th/td pairs.
  if (fields.length === 0) {
    $("table table tr").each((_, tr) => {
      const cells = $(tr).find("td,th");
      if (cells.length === 2) {
        const label = $(cells[0]).text().replace(/\s+/g, " ").trim();
        const value = $(cells[1]).text().replace(/\s+/g, " ").trim();
        if (label) fields.push({ label, value });
      }
    });
  }

  const photoImg = $("img").filter((_, el) => {
    const src = $(el).attr("src") ?? "";
    return /photo|avatar|student|image/i.test(src);
  });
  const photo = photoImg.attr("src") ?? null;

  return { fields, photo };
}
