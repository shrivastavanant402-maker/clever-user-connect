import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  PenLine,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { FeedEvent, SlotState } from "@/lib/upload-state";
import type { RequiredDoc } from "@/lib/requirements.functions";

const toneClass: Record<FeedEvent["tone"], string> = {
  info: "text-[#6b7280]",
  success: "text-emerald-700",
  warning: "text-amber-700",
  error: "text-red-700",
};

export function ProcessingColumn({
  docs,
  slots,
  events,
}: {
  docs: RequiredDoc[];
  slots: Record<string, SlotState>;
  events: FeedEvent[];
}) {
  const mandatory = docs.filter((d) => d.mandatory);
  const verified = mandatory.filter((d) => slots[d.id]?.verdict?.status === "verified").length;
  const warnings = docs.filter((d) => slots[d.id]?.verdict?.status === "warning");
  const rejected = docs.filter((d) => slots[d.id]?.verdict?.status === "rejected");
  const readiness = mandatory.length
    ? Math.round(
        Math.max(
          0,
          (verified / mandatory.length) * 100 - (warnings.length / mandatory.length) * 10,
        ),
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* Live processing header */}
      <section className="rounded-2xl border border-[#eae8e3] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0a0a0a]">
              <Activity className="h-4 w-4 text-[#0a0a0a]" /> Live processing
            </h2>
            <p className="mt-1 text-xs text-[#6b7280]">
              {verified} of {mandatory.length || "—"} mandatory documents verified
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">{readiness}%</span>
            <span className="block text-[11px] font-medium text-[#6b7280]">Readiness</span>
          </div>
        </div>
        <Progress value={readiness} className="mt-3.5 h-2 bg-[#eae8e3]" />
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]">
            <CheckCircle2 className="h-3 w-3" /> {verified} verified
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-semibold text-[#92400e]">
            <AlertTriangle className="h-3 w-3" /> {warnings.length} flagged
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fde4e1] px-2.5 py-1 text-[11px] font-semibold text-[#991b1b]">
            <XCircle className="h-3 w-3" /> {rejected.length} rejected
          </span>
        </div>
      </section>

      {/* Activity stream */}
      <section className="rounded-2xl border border-[#eae8e3] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="border-b border-[#f0eee8] px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">
            Activity stream
          </span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <ul className="max-h-60 space-y-2.5 overflow-y-auto px-5 py-4 text-xs font-mono">
          {events.length === 0 && (
            <li className="text-[#9ca3af] font-sans text-xs italic">
              Upload a document to watch OCR, classification and validation run in real time.
            </li>
          )}
          {events.map((e) => (
            <li key={e.id} className="flex gap-2.5 items-start">
              <span className="shrink-0 text-[#9ca3af] tabular-nums">{e.time}</span>
              <span className={toneClass[e.tone]}>
                <strong className="font-semibold text-[#0a0a0a]">{e.docName}</strong> — {e.message}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Verification details for each uploaded doc */}
      {docs.map((doc) => {
        const v = slots[doc.id]?.verdict;
        if (!v) return null;
        const Icon =
          v.status === "verified" ? CheckCircle2 : v.status === "warning" ? AlertTriangle : XCircle;
        const badgeBg =
          v.status === "verified"
            ? "bg-[#dcfce7] text-[#166534]"
            : v.status === "warning"
              ? "bg-[#fef3c7] text-[#92400e]"
              : "bg-[#fde4e1] text-[#991b1b]";
        const iconColor =
          v.status === "verified"
            ? "text-emerald-600"
            : v.status === "warning"
              ? "text-amber-600"
              : "text-red-600";

        return (
          <section
            key={doc.id}
            className="rounded-2xl border border-[#eae8e3] bg-white p-5 space-y-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              <span className="font-bold text-[#0a0a0a] text-sm">{doc.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeBg}`}>
                {v.status}
              </span>
              <span className="rounded-full bg-[#f4f3ef] px-2 py-0.5 text-[11px] text-[#6b7280]">
                {v.detectedType || "Document"}
              </span>
              <span className="ml-auto text-xs font-semibold text-[#6b7280]">
                {v.confidence}% confidence
              </span>
            </div>

            {(v.issuingAuthority || v.isGovernmentForm) && (
              <p className="text-xs text-[#6b7280]">
                {v.isGovernmentForm ? "Filled government form" : "Issued document"}
                {v.issuingAuthority ? ` — ${v.issuingAuthority}` : ""}
                {` · signature ${v.signaturePresent ? "present" : "missing"} · stamp ${v.stampPresent ? "present" : "missing"}`}
              </p>
            )}

            {v.extractedFields.length > 0 && (
              <ul className="divide-y divide-[#f5f4ef] rounded-xl border border-[#eae8e3] bg-[#faf9f7] text-xs">
                {v.extractedFields.map((f) => (
                  <li key={f.label} className="flex flex-wrap items-center gap-2 px-3.5 py-2">
                    <span className="text-[#6b7280] font-medium">{f.label}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-[#0a0a0a]">
                      {f.value || "—"}
                    </span>
                    {f.entryMode === "handwritten" && (
                      <span className="flex items-center gap-1 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold text-[#92400e]">
                        <PenLine className="h-3 w-3" /> handwritten
                      </span>
                    )}
                    {f.entryMode === "stamped" && (
                      <span className="rounded-full bg-[#f4f3ef] px-2 py-0.5 text-[10px] text-[#6b7280]">
                        stamped
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        f.status === "ok"
                          ? "text-emerald-700"
                          : f.status === "missing" || f.status === "invalid"
                            ? "text-red-700"
                            : "text-amber-700"
                      }`}
                      title={f.note}
                    >
                      {f.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {v.requirementChecks.length > 0 && (
              <ul className="space-y-1.5 text-xs">
                {v.requirementChecks.map((c) => (
                  <li key={c.requirement} className="flex gap-2 items-start">
                    {c.met ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                    )}
                    <span className="text-[#0a0a0a]">
                      {c.requirement}
                      {c.evidence && <span className="text-[#6b7280]"> — {c.evidence}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {v.incompleteFields.length > 0 && (
              <p className="rounded-xl bg-[#fde4e1] px-3.5 py-2 text-xs font-medium text-[#991b1b]">
                Incomplete fields: {v.incompleteFields.join(", ")}
              </p>
            )}

            {v.handwrittenEntries.length > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-[#fef3c7] px-3.5 py-2 text-xs font-medium text-[#92400e]">
                <PenLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Handwritten entries detected: {v.handwrittenEntries.join(", ")}
              </p>
            )}

            {v.tamperingSuspected && (
              <p className="flex items-center gap-2 rounded-xl bg-[#fde4e1] px-3.5 py-2 text-xs font-bold text-[#991b1b]">
                <ShieldAlert className="h-3.5 w-3.5" /> Possible tampering detected — manual review
                required.
              </p>
            )}

            {v.issues.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {v.issues.map((i) => (
                  <li
                    key={i}
                    className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-medium text-[#92400e]"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-xl bg-[#faf9f7] border border-[#eae8e3] p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0a0a0a]">
                <Lightbulb className="h-3.5 w-3.5 text-[#0a0a0a]" /> AI insight & recommendations
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4b5563]">{v.insight}</p>
              {v.fixSteps.length > 0 && (
                <ol className="mt-2.5 space-y-1 text-xs text-[#0a0a0a]">
                  {v.fixSteps.map((s, i) => (
                    <li key={s} className="flex gap-2">
                      <span className="font-bold text-[#0a0a0a]">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
