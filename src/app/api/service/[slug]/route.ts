import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSessionCookies } from "@/lib/auth";
import { upstreamFetch } from "@/lib/http";
import { getService } from "@/lib/services";

export const dynamic = "force-dynamic";

/**
 * GET /api/service/<slug>
 *
 * Loads the upstream service page and returns the data the original form
 * carries silently: hidden inputs (student id, name, programme, level, …)
 * plus the real <select> option lists. The portal re-uses both so the form
 * behaves like the original without hard-coding university data.
 */

const BOILER = /sendmailtocollege|saveprogramme|suggestionbox|login/i;

/**
 * When the page has no dedicated service form, remove the shared modal forms
 * (complaint / programme choice / suggestion box) so their fields don't leak
 * into the prefill.
 */
function stripBoilerplate($: cheerio.CheerioAPI) {
  $("form").each((_, el) => {
    const marker = `${$(el).attr("id") ?? ""} ${$(el).attr("action") ?? ""}`;
    if (BOILER.test(marker)) $(el).remove();
  });
  return $.root();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const spec = getService(slug);
  if (!spec) {
    return NextResponse.json({ message: "Unknown service" }, { status: 404 });
  }

  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  let res: Response;
  try {
    res = await upstreamFetch(spec.upstreamPath, { cookies });
  } catch {
    return NextResponse.json(
      { message: "Could not reach STS upstream" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { message: "STS did not return the service page." },
      { status: 502 },
    );
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Locate the service form (fall back to the first non-boilerplate form).
  let $form = spec.formId ? $(`form#${spec.formId}`).first() : $();
  if (!$form.length) {
    $("form").each((_, el) => {
      if ($form.length) return;
      const marker = `${$(el).attr("id") ?? ""} ${$(el).attr("action") ?? ""}`;
      if (!BOILER.test(marker)) $form = $(el);
    });
  }
  const $scope = $form.length ? $form : stripBoilerplate($);

  const prefill: Record<string, string> = {};
  const selects: Record<string, { value: string; label: string }[]> = {};

  $scope.find("input").each((_, el) => {
    const name = $(el).attr("name");
    if (!name || name === "_token") return;
    const type = ($(el).attr("type") ?? "text").toLowerCase();
    if (["file", "submit", "button", "reset", "image"].includes(type)) return;
    if ((type === "checkbox" || type === "radio") && $(el).attr("checked") === undefined) {
      return;
    }
    const value = $(el).attr("value");
    if (value !== undefined) prefill[name] = value;
  });

  $scope.find("select").each((_, el) => {
    const name = $(el).attr("name");
    if (!name) return;
    const opts: { value: string; label: string }[] = [];
    $(el)
      .find("option")
      .each((__, o) => {
        const value = $(o).attr("value") ?? "";
        const label = $(o).text().trim();
        if (!value) return; // skip the placeholder
        opts.push({ value, label: label || value });
      });
    if (opts.length) selects[name] = opts;
  });

  $scope.find("textarea").each((_, el) => {
    const name = $(el).attr("name");
    if (!name) return;
    const text = $(el).text().trim();
    if (text) prefill[name] = text;
  });

  return NextResponse.json({ prefill, selects });
}
