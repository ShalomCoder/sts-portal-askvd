import { NextRequest, NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import {
  extractSetCookies,
  relaySetCookieHeader,
  upstreamFetch,
  type UpstreamCookies,
} from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Payment initiation orchestrator.
 *
 * Mirrors the upstream /services/pay page JS exactly (see FINDINGS §5):
 *   1. GET  /pay                  -> scrape _token, clientref, merchant creds
 *   2. GET  setdetails?...        -> reserve a payment reference
 *   3. POST <engine endpoint>     -> obtain the gateway redirect URL
 *
 * ⚠️ MUTATING & DELIBERATELY UNTESTED. setdetails reserves a refcode and the
 * engine endpoints may create a pending payment session at the gateway.
 * Nothing here is executed against the real backend during development.
 */

const FEE_NAMES: Record<string, string> = {
  "001": "Academic fees payment",
  "002": "Residential fees payment",
  "006": "Resit fees payment",
  "007": "Internship fees payment",
};

type EngineResult =
  | { kind: "url"; url: string }
  | {
      kind: "form";
      action: string;
      fields: Record<string, string>;
    };

export async function POST(req: NextRequest) {
  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  let body: {
    fee_code?: string;
    amount?: string;
    phone?: string;
    paywith?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const feeCode = String(body.fee_code ?? "");
  const amount = String(body.amount ?? "");
  const phone = String(body.phone ?? "");
  const paywith = String(body.paywith ?? "");
  const feeName = FEE_NAMES[feeCode];

  if (!feeName || !amount || !phone || !paywith) {
    return NextResponse.json(
      { message: "fee_code, amount, phone and paywith are required" },
      { status: 400 },
    );
  }
  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json(
      { message: "Phone number must be 10 digits" },
      { status: 400 },
    );
  }

  // --- Step 1: scrape the pay page for session material -----------------
  const payPage = await upstreamFetch("/pay", { cookies });
  if (payPage.status === 301 || payPage.status === 302 || payPage.status === 303) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }
  const html = await payPage.text();

  const token = pick(html, "_token");
  const clientref = pick(html, "clientref");
  const clientid = pick(html, "clientid");
  const clientsecret = pick(html, "clientsecret");
  const secureHash = pick(html, "secureHash");
  const studentId = pick(html, "clientrefold");
  const studentName = pick(html, "studentname");
  const offtypeCode = pick(html, "offtype_code") || "01";

  if (!token || !clientref || !studentId || !studentName) {
    return NextResponse.json(
      { message: "Could not read payment details from STS. Try again later." },
      { status: 502 },
    );
  }

  // --- Step 2: reserve the payment reference ----------------------------
  const engineUpper = paywith.toUpperCase();
  const setdetailsUrl =
    `/setdetails?amount=${encodeURIComponent(amount)}` +
    `&fee_code=${encodeURIComponent(feeCode)}` +
    `&fee_name=${encodeURIComponent(feeName)}` +
    `&refcode=${encodeURIComponent(clientref)}` +
    `&paymentengine=${encodeURIComponent(engineUpper)}` +
    `&PHONE=${encodeURIComponent(phone)}`;

  let setRes: Response;
  try {
    setRes = await upstreamFetch(setdetailsUrl, { cookies });
  } catch {
    return NextResponse.json(
      { message: "Could not reach STS upstream" },
      { status: 502 },
    );
  }
  const setData = (await setRes.json().catch(() => null)) as {
    status?: string;
    refcode?: string;
  } | null;

  if (!setData || setData.status !== "success" || !setData.refcode) {
    return NextResponse.json(
      { message: "Could not reserve a payment reference. Try again later." },
      { status: 502 },
    );
  }
  const refcode = setData.refcode;

  // --- Step 3: engine-specific initiation --------------------------------
  let result: EngineResult;
  try {
    switch (paywith) {
      case "newmyghpay":
        result = await jsonEngine("/myghpay-create-auth", cookies, {
          _token: token,
          amount,
          fee_code: feeCode,
          fee_name: feeName,
          clientref: refcode,
          paymentengine: engineUpper,
          phone,
          student_name: studentName,
          // MyGHPAY auth response: { response: { payload: { redirectUrl } } }
          __extract: "myghpay",
        });
        break;
      case "zenith":
        result = await jsonEngine("/zenithinit", cookies, {
          _token: token,
          paymentengine: engineUpper,
          clientid: clientid ?? "",
          clientsecret: clientsecret ?? "",
          secureHash: secureHash ?? "",
          returnurl: `https://sts.ug.edu.gh/services/feedback?paymenttype=${feeCode}`,
          itemname: `${studentId}|${feeName}|${studentName}`,
          feename: feeName,
          offtype_code: offtypeCode,
          clientref: refcode,
          clientrefold: studentId,
          studentname: studentName,
          paymenttype: feeCode,
          amount,
          paywith,
          phone,
          // zenith response: { status: "success", url }
          __extract: "url",
        });
        break;
      case "calbank":
        result = await jsonEngine("/calpay/initiate", cookies, {
          _token: token,
          student_id: studentId,
          student_name: studentName,
          amount,
          fee_code: feeCode,
          fee_name: feeName,
          refcode,
          phone,
          email: "",
          offtype_code: offtypeCode,
          // calpay response: { success, redirect_url }
          __extract: "redirect_url",
        });
        break;
      case "access":
        result = await jsonEngine("/access/initiate", cookies, {
          _token: token,
          student_id: studentId,
          student_name: studentName,
          amount,
          fee_code: feeCode,
          fee_name: feeName,
          refcode,
          phone,
          email: "",
          offtype_code: offtypeCode,
          // access response: { data: { checkoutUrl } }
          __extract: "checkoutUrl",
        });
        break;
      case "quipu":
      case "kowri":
        // Full-page form POST: upstream answers with either a 302 to the
        // gateway or an HTML page containing an auto-submit form. We relay
        // whichever it gives us and let the client finish the navigation.
        result = await formEngine(
          paywith === "quipu" ? "/quipucheckoutbefore" : "/stanbiccheckoutbefore",
          cookies,
          {
            _token: token,
            paymentengine: engineUpper,
            clientid: clientid ?? "",
            clientsecret: clientsecret ?? "",
            secureHash: secureHash ?? "",
            returnurl: `https://sts.ug.edu.gh/services/feedback?paymenttype=${feeCode}`,
            itemname: `${studentId}|${feeName}|${studentName}`,
            feename: feeName,
            offtype_code: offtypeCode,
            clientref: refcode,
            clientrefold: studentId,
            studentname: studentName,
            paymenttype: feeCode,
            amount,
            paywith,
            phone,
          },
        );
        break;
      default:
        return NextResponse.json(
          { message: `Unsupported payment method: ${paywith}` },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      { message: "Could not reach the payment gateway. Try again later." },
      { status: 502 },
    );
  }

  const next = NextResponse.json({ refcode, ...serialize(result) });
  for (const c of extractSetCookies(setRes)) {
    if (c.name === "sts_session" || c.name === "XSRF-TOKEN") {
      next.headers.append("Set-Cookie", relaySetCookieHeader(c));
    }
  }
  return next;
}

/* ---------------- helpers ---------------- */

/** Pull a hidden input's value out of the scraped pay page HTML. */
function pick(html: string, name: string): string | null {
  const re = new RegExp(
    `<input[^>]+name=["']${name}["'][^>]*value=["']([^"']*)["']`,
    "i",
  );
  const reRev = new RegExp(
    `<input[^>]+value=["']([^"']*)["'][^>]*name=["']${name}["']`,
    "i",
  );
  return html.match(re)?.[1] ?? html.match(reRev)?.[1] ?? null;
}

function serialize(r: EngineResult): Record<string, unknown> {
  return r.kind === "url" ? { redirectUrl: r.url } : { form: r };
}

type EngineFieldBag = Record<string, string> & { __extract: string };

/** POST urlencoded to a JSON gateway-init endpoint; extract the redirect. */
async function jsonEngine(
  path: string,
  cookies: UpstreamCookies,
  fields: EngineFieldBag,
): Promise<EngineResult> {
  const { __extract: extract, ...rest } = fields;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) params.set(k, v);

  const res = await upstreamFetch(path, {
    method: "POST",
    cookies,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!data) throw new Error("non-JSON engine response");

  const url =
    extract === "myghpay"
      ? dig(data, "response", "payload", "redirectUrl")
      : extract === "checkoutUrl"
        ? dig(data, "data", "checkoutUrl")
        : (data[extract] as string | undefined);

  if (typeof url !== "string" || !url) throw new Error("no redirect in response");
  return { kind: "url", url };
}

/**
 * POST urlencoded as a full-page checkout form (quipu/kowri). Upstream
 * answers 302 -> gateway URL, or HTML with a form we hand back for
 * auto-submission.
 */
async function formEngine(
  path: string,
  cookies: UpstreamCookies,
  fields: Record<string, string>,
): Promise<EngineResult> {
  const params = new URLSearchParams(fields);
  const res = await upstreamFetch(path, {
    method: "POST",
    cookies,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (res.status === 301 || res.status === 302 || res.status === 303) {
    const loc = res.headers.get("location");
    if (loc) return { kind: "url", url: loc };
  }

  const html = await res.text();
  // Auto-submit form pointing at the gateway?
  const action = html.match(/<form[^>]+action=["']([^"']+)["']/i)?.[1];
  if (action && /https?:\/\//i.test(action)) {
    const fieldsOut: Record<string, string> = {};
    const inputRe =
      /<input[^>]+name=["']([^"']+)["'][^>]*value=["']([^"']*)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = inputRe.exec(html))) fieldsOut[m[1]] = m[2];
    return { kind: "form", action, fields: fieldsOut };
  }
  // Meta refresh?
  const meta = html.match(
    /<meta[^>]+http-equiv=["']refresh["'][^>]+url=["']([^"']+)["']/i,
  );
  if (meta) return { kind: "url", url: meta[1] };
  throw new Error("unrecognized checkout response");
}

function dig(obj: unknown, ...path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
