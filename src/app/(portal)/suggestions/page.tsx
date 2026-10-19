"use client";

import { useState, type FormEvent } from "react";
import { Card, PageHeader } from "@/components/ui";
import { MegaphoneIcon } from "@/components/icons";

/**
 * Suggestions drop-box. Mirrors the upstream modal:
 *   POST suggestions { message }
 *
 * ⚠️ Mutating & deliberately UNTESTED.
 */
export default function SuggestionsPage() {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "ok" } | { kind: "err"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/sts/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status === "error") {
        setState({
          kind: "err",
          message: data?.message ?? "Could not send your suggestion.",
        });
        return;
      }
      setMessage("");
      setState({ kind: "ok" });
    } catch {
      setState({ kind: "err", message: "Network error — please try again." });
    }
  }

  return (
    <>
      <PageHeader
        title="Suggestions"
        subtitle="Tell us how to improve student services"
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <MegaphoneIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink-900">Drop your suggestion</h2>
              <p className="text-xs text-ink-500">
                Max 220 characters · goes to the STS team
              </p>
            </div>
          </div>

          <div className="banner banner-warn mb-4">
            This endpoint is forwarded to the official STS backend but has{" "}
            <strong>not been tested end-to-end</strong>.
          </div>

          {state.kind === "ok" && (
            <div className="banner banner-success mb-4">
              Thank you — your suggestion has been sent.
            </div>
          )}
          {state.kind === "err" && (
            <div className="banner banner-danger mb-4" role="alert">
              {state.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <textarea
              className="field"
              rows={5}
              maxLength={220}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Drop your suggestions"
              required
            />
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span>Be specific and constructive.</span>
              <span>{message.length}/220</span>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={state.kind === "loading" || !message.trim()}
            >
              {state.kind === "loading" ? "Sending…" : "Send suggestion"}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
