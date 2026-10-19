"use client";

import { useState, type FormEvent } from "react";
import { Card, PageHeader } from "@/components/ui";
import { WalletIcon } from "@/components/icons";

/**
 * Make a fee payment.
 *
 * ⚠️ This flow reserves a payment reference and initiates a gateway session
 * upstream. It mirrors the documented upstream JS exactly (FINDINGS §5) but
 * has deliberately NOT been executed end-to-end during development.
 */

const FEE_OPTIONS = [
  { value: "001", label: "Academic Fees", fixedAmount: null as number | null },
  { value: "002", label: "Residential Fees", fixedAmount: null },
  { value: "007", label: "Internship Fees", fixedAmount: 10 },
];

const PAY_OPTIONS = [
  { value: "newmyghpay", label: "MYGHPAY", hint: "Mobile money & cards via GhIPPS" },
  { value: "zenith", label: "Zenith Bank", hint: "Zenith MPGSS gateway" },
  { value: "calbank", label: "CalBank", hint: "CalPay gateway" },
  { value: "access", label: "Access Bank", hint: "AccessPay gateway" },
  { value: "quipu", label: "PBLGH (Quipu)", hint: "Bank transfer checkout" },
  { value: "kowri", label: "KOWRI", hint: "Stanbic checkout" },
];

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "err"; message: string };

export default function PayPage() {
  const [feeCode, setFeeCode] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [paywith, setPaywith] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const selectedFee = FEE_OPTIONS.find((f) => f.value === feeCode);

  function onFeeChange(value: string) {
    setFeeCode(value);
    const fee = FEE_OPTIONS.find((f) => f.value === value);
    setAmount(fee?.fixedAmount != null ? String(fee.fixedAmount) : "");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/pay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee_code: feeCode, amount, phone, paywith }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && data?.unauthenticated) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        setState({
          kind: "err",
          message: data?.message ?? `Payment initiation failed (${res.status}).`,
        });
        return;
      }
      if (typeof data.redirectUrl === "string" && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.form?.action) {
        // Auto-submit the gateway form handed back by quipu/kowri checkout.
        const f = document.createElement("form");
        f.method = "POST";
        f.action = data.form.action;
        for (const [k, v] of Object.entries(
          data.form.fields as Record<string, string>,
        )) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          f.appendChild(input);
        }
        document.body.appendChild(f);
        f.submit();
        return;
      }
      setState({
        kind: "err",
        message: "The gateway did not return a redirect. Nothing was charged.",
      });
    } catch {
      setState({
        kind: "err",
        message: "Network error — please try again.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Pay Fees"
        subtitle="Academic, residential and internship fees via GhIPPS and partner banks"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="banner banner-warn mb-5">
            This payment flow is forwarded to the official STS backend but has{" "}
            <strong>not been tested end-to-end</strong>. Verify the fee type,
            amount and phone number carefully before continuing. You will be
            handed off to the payment gateway to complete payment.
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="label">
                Fee type <span className="text-red-600">*</span>
              </label>
              <select
                className="field"
                value={feeCode}
                onChange={(e) => onFeeChange(e.target.value)}
                required
              >
                <option value="">Please select fee type</option>
                {FEE_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Amount (GHC) <span className="text-red-600">*</span>
              </label>
              <input
                className="field"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                readOnly={selectedFee?.fixedAmount != null}
                placeholder="0.00"
                required
              />
              {selectedFee?.fixedAmount != null && (
                <p className="mt-1 text-xs text-ink-400">
                  Fixed amount for this fee type.
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Phone number <span className="text-red-600">*</span>
              </label>
              <input
                className="field"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="0XX XXX XXXX"
                required
              />
              <p className="mt-1 text-xs text-ink-400">
                Used for payment notifications by the gateway.
              </p>
            </div>

            <div>
              <label className="label">
                Pay with <span className="text-red-600">*</span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAY_OPTIONS.map((p) => (
                  <label
                    key={p.value}
                    className={
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition " +
                      (paywith === p.value
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-ink-200 hover:border-ink-300")
                    }
                  >
                    <input
                      type="radio"
                      name="paywith"
                      value={p.value}
                      checked={paywith === p.value}
                      onChange={() => setPaywith(p.value)}
                      className="mt-1 accent-[var(--color-brand-600)]"
                      required
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">
                        {p.label}
                      </span>
                      <span className="block text-xs text-ink-500">
                        {p.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {state.kind === "err" && (
              <div className="banner banner-danger" role="alert">
                {state.message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={state.kind === "loading"}
            >
              {state.kind === "loading" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Preparing gateway…
                </>
              ) : (
                <>
                  <WalletIcon className="h-4 w-4" />
                  Continue to payment
                </>
              )}
            </button>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card>
            <h3 className="font-semibold text-ink-900">Before you pay</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-600">
              <li>
                Confirm your fee balance with your college finance office if
                you are unsure of the amount.
              </li>
              <li>
                Residential fees are only payable when you have been allocated
                a hall.
              </li>
              <li>
                Your payment appears in{" "}
                <a
                  href="/payments"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Payment History
                </a>{" "}
                once the gateway confirms it.
              </li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-ink-900">Need help?</h3>
            <p className="mt-2 text-sm text-ink-600">
              If a payment fails or a receipt is missing, lodge a complaint
              under{" "}
              <a
                href="/complaints"
                className="font-semibold text-brand-600 hover:underline"
              >
                Complaints
              </a>{" "}
              with the transaction reference.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
