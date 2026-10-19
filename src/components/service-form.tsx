"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/client";
import type { ServiceField, ServiceSpec } from "@/lib/services";

type PrefillResponse = {
  prefill: Record<string, string>;
  selects: Record<string, { value: string; label: string }[]>;
};

type Option = { value: string; label: string };

type SubmitState =
  | { kind: "idle" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * Renders an upstream STS service as a native, styled portal form and posts it
 * back through the same-origin proxy (which injects the session CSRF token).
 *
 * Hidden values carried by the original form (student id, name, programme, …)
 * are scraped server-side and replayed on submit, so nothing is hard-coded.
 */
export default function ServiceForm({ spec }: { spec: ServiceSpec }) {
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  const [selects, setSelects] = useState<PrefillResponse["selects"]>({});
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [lookupOpts, setLookupOpts] = useState<Option[] | null>(null);
  const [sources, setSources] = useState<Record<string, Option[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitState>({ kind: "idle" });

  /* ---------------------------- load prefill ---------------------------- */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<PrefillResponse>(`/api/service/${spec.slug}`)
      .then((data) => {
        if (!alive) return;
        setPrefill(data.prefill ?? {});
        setSelects(data.selects ?? {});
        const initial: Record<string, string | string[]> = {};
        for (const f of spec.fields) {
          if (f.type === "checkboxes") initial[f.name] = [];
          else initial[f.name] = data.prefill?.[f.name] ?? "";
        }
        setValues(initial);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setLoadError(
          err instanceof ApiError ? err.message : "Could not load this service.",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.slug]);

  /* --------------------- dependent (lookup) options --------------------- */
  const lookupParam = spec.lookup ? values[spec.lookup.paramFrom] : undefined;
  useEffect(() => {
    if (!spec.lookup) return;
    const value = Array.isArray(lookupParam) ? lookupParam[0] : lookupParam;
    if (!value) {
      setLookupOpts(null);
      return;
    }
    let alive = true;
    api<Record<string, unknown>>(`/api/sts/${spec.lookup.endpoint}`, {
      method: "POST",
      body: JSON.stringify({ [spec.lookup.paramKey]: value }),
    })
      .then((res) => {
        if (!alive) return;
        const list = res?.[spec.lookup!.listKey];
        if (Array.isArray(list)) {
          setLookupOpts(
            list
              .map((row) => {
                const r = row as Record<string, unknown>;
                return {
                  value: String(r[spec.lookup!.valueKey] ?? ""),
                  label: String(r[spec.lookup!.labelKey] ?? ""),
                };
              })
              .filter((o) => o.value),
          );
        } else {
          setLookupOpts([]);
        }
      })
      .catch(() => alive && setLookupOpts([]));
    return () => {
      alive = false;
    };
  }, [spec, lookupParam]);

  /* ------------------- option sources (course lists, …) ------------------ */
  useEffect(() => {
    const withSource = spec.fields.filter((f) => f.source);
    if (!withSource.length) return;
    let alive = true;
    for (const f of withSource) {
      const src = f.source!;
      const url = src.endpoint.startsWith("/")
        ? src.endpoint
        : `/api/sts/${src.endpoint}`;
      api<Record<string, unknown>>(url)
        .then((res) => {
          if (!alive) return;
          const list = res?.[src.listKey];
          if (!Array.isArray(list)) return;
          const opts = list
            .map((row) => {
              const r = row as Record<string, unknown>;
              const base = String(r[src.labelKey] ?? "");
              const extra = src.labelExtraKey
                ? String(r[src.labelExtraKey] ?? "")
                : "";
              return {
                value: String(r[src.valueKey] ?? ""),
                label: extra ? `${base} — ${extra}` : base,
              };
            })
            .filter((o) => o.value);
          setSources((prev) => ({ ...prev, [f.name]: opts }));
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.slug]);

  const optionsFor = useMemo(() => {
    return (field: ServiceField): Option[] => {
      if (spec.lookup?.target === field.name && lookupOpts) return lookupOpts;
      const src = sources[field.name];
      if (src?.length) return src;
      const parsed = selects[field.name];
      if (parsed?.length) return parsed;
      if (field.options) return field.options.map((v) => ({ value: v, label: v }));
      return [];
    };
  }, [selects, lookupOpts, sources, spec.lookup]);

  function setValue(name: string, v: string | string[]) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  /* -------------------------------- submit ------------------------------ */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult({ kind: "idle" });

    // Replay the upstream hidden fields, then layer the user's input on top.
    const payload: Record<string, unknown> = { ...prefill };
    for (const f of spec.fields) {
      const v = values[f.name];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      payload[f.name] = v;
    }
    if (spec.lookup) {
      const target = spec.lookup.target;
      if (!payload[target]) delete payload[target];
    }

    try {
      let res: Record<string, unknown>;
      if (spec.multipart) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(payload)) {
          if (Array.isArray(v)) v.forEach((item) => fd.append(k, String(item)));
          else fd.append(k, String(v));
        }
        for (const f of spec.fields) {
          if (f.type !== "file") continue;
          const file = files[f.name];
          if (file) fd.append(f.name, file);
        }
        res = await api<Record<string, unknown>>(`/api/sts/${spec.endpoint}`, {
          method: "POST",
          body: fd,
        });
      } else {
        res = await api<Record<string, unknown>>(`/api/sts/${spec.endpoint}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const status = typeof res.status === "string" ? res.status : undefined;
      const message =
        typeof res.message === "string" ? res.message : undefined;

      if (status === "error" || status === "fail") {
        setResult({
          kind: "error",
          message: message ?? "STS reported that the submission was not accepted.",
        });
      } else if (res._redirect) {
        setResult({
          kind: "done",
          message:
            "Submitted. STS redirected the original form on completion — verify the change on your dashboard.",
        });
      } else {
        setResult({
          kind: "done",
          message:
            message ??
            "Your submission was sent to STS. Please confirm it took effect before relying on it.",
        });
      }
    } catch (err) {
      setResult({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Submission failed. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-7">
        <div className="space-y-4">
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-2/3" />
          <div className="skeleton h-11 w-40" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return <div className="banner banner-danger">{loadError}</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="banner banner-warn">
        This form changes your official student record at STS. Please review the
        details before submitting — the portal passes the change straight to the
        university system.
      </div>

      {spec.notes?.length ? (
        <ul className="space-y-1.5 text-sm text-ink-500">
          {spec.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-500" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {spec.fields.some((f) => f.name === "documents") ||
      spec.fields.some((f) => f.type === "file") ? (
        <div className="banner banner-info">
          Attach documents where relevant. Files are uploaded with the same
          session used by the official STS form.
        </div>
      ) : null}

      <div className="card p-6 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {spec.fields.map((field) => {
            const id = `${spec.slug}-${field.name.replace(/[^\w-]/g, "_")}`;
            const value = values[field.name];
            const wide = field.full || field.type === "textarea";

            return (
              <div key={field.name} className={wide ? "sm:col-span-2" : ""}>
                {field.type === "checkboxes" ? (
                  <>
                    <span className="label">{field.label}</span>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {optionsFor(field).map((o) => {
                        const arr = Array.isArray(value) ? value : [];
                        return (
                          <label
                            key={o.value}
                            className="flex items-center gap-2 text-sm text-ink-700"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[var(--color-brand-600)]"
                              checked={arr.includes(o.value)}
                              onChange={(e) =>
                                setValue(
                                  field.name,
                                  e.target.checked
                                    ? [...arr, o.value]
                                    : arr.filter((x) => x !== o.value),
                                )
                              }
                            />
                            {o.label}
                          </label>
                        );
                      })}
                    </div>
                  </>
                ) : field.type === "file" ? (
                  <>
                    <label className="label" htmlFor={id}>
                      {field.label}
                    </label>
                    <input
                      id={id}
                      type="file"
                      className="field file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
                      onChange={(e) =>
                        setFiles((prev) => ({
                          ...prev,
                          [field.name]: e.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    {field.help && (
                      <p className="mt-1 text-xs text-ink-400">{field.help}</p>
                    )}
                  </>
                ) : field.type === "select" ? (
                  <>
                    <label className="label" htmlFor={id}>
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-brand-600">*</span>
                      )}
                    </label>
                    <select
                      id={id}
                      className="field"
                      required={field.required}
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {optionsFor(field).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {optionsFor(field).length === 0 && (
                      <p className="mt-1 text-xs text-ink-400">
                        Options load automatically.{" "}
                        {spec.lookup?.paramFrom === field.name
                          ? "Choose a value above."
                          : "Fetching from STS…"}
                      </p>
                    )}
                  </>
                ) : field.type === "textarea" ? (
                  <>
                    <label className="label" htmlFor={id}>
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-brand-600">*</span>
                      )}
                    </label>
                    <textarea
                      id={id}
                      rows={4}
                      className="field"
                      required={field.required}
                      placeholder={field.placeholder}
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="label" htmlFor={id}>
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-brand-600">*</span>
                      )}
                    </label>
                    <input
                      id={id}
                      type={field.type ?? "text"}
                      className="field"
                      required={field.required}
                      placeholder={field.placeholder}
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    />
                    {field.help && (
                      <p className="mt-1 text-xs text-ink-400">{field.help}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-5">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit to STS"}
          </button>
          <span className="text-xs text-ink-400">
            Sent over your existing STS session — no extra sign-in.
          </span>
        </div>
      </div>

      {result.kind === "done" && (
        <div className="banner banner-success">{result.message}</div>
      )}
      {result.kind === "error" && (
        <div className="banner banner-danger" role="alert">
          {result.message}
        </div>
      )}
    </form>
  );
}
