import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  ShieldAlert,
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
    <div className="space-y-5">
      <section className="panel p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-4 w-4 text-primary" /> Live processing
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {verified} of {mandatory.length || "—"} mandatory documents verified
            </p>
          </div>
          <p className="text-4xl font-semibold text-gradient">{readiness}%</p>
        </div>
        <Progress value={readiness} className="mt-4 h-2.5" />
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
              <span className={`text-xs ${cls}`}>{v.status}</span>
              <span className="ml-auto text-xs text-muted-foreground">{v.confidence}% confidence</span>
            </div>

            {v.extractedFields.length > 0 && (
              <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                {v.extractedFields.map((f) => (
                  <div key={f.label} className="flex gap-2">
                    <dt className="text-muted-foreground">{f.label}:</dt>
                    <dd className="min-w-0 truncate">{f.value}</dd>
                  </div>
                ))}
              </dl>
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
