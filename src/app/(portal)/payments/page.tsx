"use client";

import { useState } from "react";
import {
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  Skeleton,
  useAuthedFetch,
} from "@/components/ui";
import { CardIcon, PrintIcon } from "@/components/icons";
import { money, shortDate } from "@/lib/fmt";

/** GET /api/payments — server-side parsed from /services/history. */
export type PaymentRow = {
  date: string;
  feeType: string;
  method: string;
  amount: string;
  reference: string;
  printPath: string | null;
};
type PaymentsPayload = {
  rows: PaymentRow[];
  raw: boolean;
};

export default function PaymentsPage() {
  const { data, error, loading } =
    useAuthedFetch<PaymentsPayload>("/api/payments");
  const [query, setQuery] = useState("");

  const rows = data?.rows ?? [];
  const filtered = rows.filter((r) =>
    Object.values(r).some((v) =>
      String(v).toLowerCase().includes(query.toLowerCase()),
    ),
  );

  async function openReceipt(printPath: string) {
    // Receipts are upstream PDFs served through the proxy (binary passthrough).
    const url = `/api/sts/${printPath.replace(/^\//, "")}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <>
      <PageHeader
        title="Payment History"
        subtitle="Fee payments recorded by STS / GhIPPS"
        action={
          rows.length > 0 ? (
            <input
              className="field !w-64"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          ) : undefined
        }
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon={<CardIcon className="h-6 w-6" />}
          title="No payments yet"
          body="Once you pay fees through the portal, your receipts and GhIPPS references will appear here."
        />
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Transactions
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-900">
                {rows.length}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Total paid
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-900">
                GHC{" "}
                {money(
                  rows.reduce((sum, r) => {
                    const n = Number(String(r.amount).replace(/[^\d.]/g, ""));
                    return sum + (Number.isFinite(n) ? n : 0);
                  }, 0),
                )}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Latest
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-900">
                {rows[0]?.date ? shortDate(rows[0].date) : "—"}
              </p>
            </Card>
          </div>

          <Card className="!p-0 overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fee type</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="text-right">Amount</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap">{shortDate(r.date)}</td>
                    <td>{r.feeType}</td>
                    <td>
                      <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
                        {r.method || "—"}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{r.reference || "—"}</td>
                    <td className="text-right font-semibold">
                      GHC {money(r.amount)}
                    </td>
                    <td>
                      {r.printPath ? (
                        <button
                          onClick={() => openReceipt(r.printPath!)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                        >
                          <PrintIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data?.raw && (
            <p className="text-xs text-ink-400">
              Some rows could not be parsed and were omitted.
            </p>
          )}
        </div>
      )}
    </>
  );
}
