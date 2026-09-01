import { CheckCircle2, AlertTriangle, XCircle, Copy, ListChecks } from "lucide-react";
import type { DocFinding, VerificationResult } from "@/lib/verify.functions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusMeta: Record<
  DocFinding["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  verified: { label: "Verified", icon: CheckCircle2, className: "text-success" },
  warning: { label: "Needs review", icon: AlertTriangle, className: "text-warning" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-destructive" },
};

export function ResultsPanel({ result }: { result: VerificationResult }) {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Application readiness</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{result.summary}</p>
          </div>
          <p className="text-5xl font-semibold text-gradient">{result.readiness}%</p>
        </div>
        <Progress value={result.readiness} className="mt-5 h-2.5" />
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold">Document checks</h3>
        </div>
        <ul className="divide-y divide-border">
          {result.findings.map((f, i) => {
            const meta = statusMeta[f.status] ?? statusMeta.warning;
            const Icon = meta.icon;
            return (
              <li key={`${f.fileName}-${i}`} className="space-y-3 px-6 py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Icon className={`h-5 w-5 shrink-0 ${meta.className}`} />
                  <span className="font-medium">{f.detectedType || "Unknown document"}</span>
                  <Badge variant="secondary">{f.matchedRequirement ?? "Unmatched"}</Badge>
                  <span className={`text-sm ${meta.className}`}>{meta.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {f.confidence}% confidence · {f.fileName}
                  </span>
                </div>

                <div className="grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-3">
                  {f.extractedName && (
                    <p>
                      Name: <span className="text-foreground">{f.extractedName}</span>
                    </p>
                  )}
                  {f.documentNumber && (
                    <p>
                      Number: <span className="text-foreground">{f.documentNumber}</span>
                    </p>
                  )}
                  {f.expiryDate && (
                    <p>
                      Expiry: <span className="text-foreground">{f.expiryDate}</span>
                    </p>
                  )}
                  <p>
                    Scan quality: <span className="text-foreground">{f.quality}</span>
                  </p>
                </div>

                {f.issues?.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {f.issues.map((issue) => (
                      <li
                        key={issue}
                        className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                      >
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-sm">{f.explanation}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4 text-destructive" /> Missing documents
          </h3>
          {result.missing.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {result.missing.map((m) => (
                <li key={m} className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
                  {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing missing. Great job.</p>
          )}

          {result.duplicates.length > 0 && (
            <>
              <h4 className="mt-6 flex items-center gap-2 text-sm font-semibold">
                <Copy className="h-4 w-4 text-warning" /> Duplicates
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {result.duplicates.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="panel p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4 text-primary" /> Recommended next actions
          </h3>
          <ol className="mt-3 space-y-2 text-sm">
            {result.nextActions.map((a, i) => (
              <li key={a} className="flex gap-3 rounded-lg bg-secondary/40 px-3 py-2">
                <span className="text-primary">{i + 1}.</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
