import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  PenLine,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { FeedEvent, SlotState } from "@/lib/upload-state";
import type { RequiredDoc } from "@/lib/requirements.functions";

const toneClass: Record<FeedEvent["tone"], string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
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
  const verified = docs.filter((d) => slots[d.id]?.verdict?.status === "verified").length;
  const warnings = docs.filter((d) => slots[d.id]?.verdict?.status === "warning");
  const rejected = docs.filter((d) => slots[d.id]?.verdict?.status === "rejected");
  
  // Every uploaded and verified document boosts the overall verification accuracy and confidence
  const accuracyScore = docs.length
    ? Math.round(
        Math.min(
          100,
          Math.max(
            0,
            (verified / docs.length) * 100 - (warnings.length * 5) - (rejected.length * 15),
          ),
        ),
      )
    : 0;

  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-4 w-4 text-primary" /> Verification & Accuracy
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {verified} of {docs.length || "—"} documents verified · Upload more to increase accuracy
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold text-gradient">{accuracyScore}%</p>
            <span className="block text-[11px] font-medium text-muted-foreground">Accuracy Score</span>
          </div>
        </div>
        <Progress value={accuracyScore} className="mt-4 h-2.5" />
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="text-success">
            {verified} verified
          </Badge>
          <Badge variant="secondary" className="text-warning">
            {warnings.length} flagged
          </Badge>
          <Badge variant="secondary" className="text-destructive">
            {rejected.length} rejected
          </Badge>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold">Activity stream</div>
        <ul className="max-h-64 space-y-2 overflow-y-auto px-5 py-4 text-xs">
          {events.length === 0 && (
            <li className="text-muted-foreground">
              Upload a document to watch OCR, classification and validation run in real time.
            </li>
          )}
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="shrink-0 tabular-nums text-muted-foreground">{e.time}</span>
              <span className={toneClass[e.tone]}>
                <span className="text-foreground">{e.docName}</span> — {e.message}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {docs.map((doc) => {
        const v = slots[doc.id]?.verdict;
        if (!v) return null;
        const Icon =
          v.status === "verified" ? CheckCircle2 : v.status === "warning" ? AlertTriangle : XCircle;
        const cls =
          v.status === "verified"
            ? "text-success"
            : v.status === "warning"
              ? "text-warning"
              : "text-destructive";
        return (
          <section key={doc.id} className="panel space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={`h-4 w-4 ${cls}`} />
              <span className="font-medium">{doc.name}</span>
              <Badge variant="secondary">{v.detectedType || "Unknown type"}</Badge>
              {v.formIdentifier && <Badge variant="secondary">{v.formIdentifier}</Badge>}
              <span className={`text-xs ${cls}`}>{v.status}</span>
              <span className="ml-auto text-xs text-muted-foreground">{v.confidence}% confidence</span>
            </div>

            {(v.issuingAuthority || v.isGovernmentForm) && (
              <p className="text-xs text-muted-foreground">
                {v.isGovernmentForm ? "Filled government form" : "Issued document"}
                {v.issuingAuthority ? ` — ${v.issuingAuthority}` : ""}
                {` · signature ${v.signaturePresent ? "present" : "missing"} · stamp ${v.stampPresent ? "present" : "missing"}`}
              </p>
            )}

            {v.extractedFields.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border text-xs">
                {v.extractedFields.map((f) => (
                  <li key={f.label} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="min-w-0 flex-1 truncate">{f.value || "—"}</span>
                    {f.entryMode === "handwritten" && (
                      <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] text-warning">
                        <PenLine className="h-3 w-3" /> handwritten
                      </span>
                    )}
                    {f.entryMode === "stamped" && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">stamped</span>
                    )}
                    <span
                      className={`text-[10px] ${
                        f.status === "ok"
                          ? "text-success"
                          : f.status === "missing" || f.status === "invalid"
                            ? "text-destructive"
                            : "text-warning"
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
              <ul className="space-y-1 text-xs">
                {v.requirementChecks.map((c) => (
                  <li key={c.requirement} className="flex gap-2">
                    {c.met ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    )}
                    <span>
                      {c.requirement}
                      {c.evidence && <span className="text-muted-foreground"> — {c.evidence}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {v.incompleteFields.length > 0 && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Incomplete: {v.incompleteFields.join(", ")}
              </p>
            )}

            {v.handwrittenEntries.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                <PenLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Handwritten entries detected: {v.handwrittenEntries.join(", ")}
              </p>
            )}

            {v.tamperingSuspected && (
              <p className="flex items-center gap-2 rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">
                <ShieldAlert className="h-3.5 w-3.5" /> Possible tampering detected — manual review
                required.
              </p>
            )}

            {v.issues.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {v.issues.map((i) => (
                  <li key={i} className="rounded-full bg-warning/15 px-3 py-1 text-[11px] text-warning">
                    {i}
                  </li>
                ))}
              </ul>
            )}

            {v.documentHash && (
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold">
                  <Fingerprint className="h-3.5 w-3.5 text-primary" /> Document Integrity
                </p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>SHA-256</p>
                  <p className="font-mono truncate text-[10px] text-foreground">{v.documentHash}</p>
                  <p className="mt-1.5 text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Fingerprint generated
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-secondary/40 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <Lightbulb className="h-3.5 w-3.5 text-primary" /> AI insight
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{v.insight}</p>
              {v.fixSteps.length > 0 && (
                <ol className="mt-2 space-y-1 text-sm">
                  {v.fixSteps.map((s, i) => (
                    <li key={s} className="flex gap-2">
                      <span className="text-primary">{i + 1}.</span>
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
