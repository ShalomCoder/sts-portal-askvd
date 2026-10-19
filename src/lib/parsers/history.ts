import * as cheerio from "cheerio";

export type PaymentRow = {
  date: string;
  feeType: string;
  method: string;
  amount: string;
  reference: string;
  /** Upstream-relative path (e.g. printpayment/&lt;studentId&gt;/&lt;reference&gt;) */
  printPath: string | null;
};

/**
 * Parse the payment-history table from services/history.
 * Columns: [checkbox] DATE | TYPE OF FEES | METHOD OF PAYMENT | AMOUNT | REFERENCE | (print link)
 * Placeholder rows use "#" as date and must be skipped.
 */
export function parsePaymentHistory(html: string): PaymentRow[] {
  const $ = cheerio.load(html);
  const rows: PaymentRow[] = [];

  $("table tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;

    let cells = tds.toArray().map((td) =>
      $(td).text().replace(/\s+/g, " ").trim(),
    );

    // Drop the leading checkbox column when present.
    if (tds.first().find("input[type='checkbox']").length > 0) {
      cells = cells.slice(1);
    }

    const [date, feeType, method, amount, reference] = cells;
    if (!date || date === "#" || /^date$/i.test(date)) return;

    const printHref =
      $(tr).find("a[href*='printpayment']").attr("href") ?? null;
    const printPath = printHref
      ? printHref.replace(/^https?:\/\/[^/]+\/services\//, "")
      : null;

    rows.push({
      date,
      feeType: feeType ?? "",
      method: method ?? "",
      amount: amount ?? "",
      reference: reference ?? "",
      printPath,
    });
  });

  return rows;
}
