import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ShieldCheck,
  Building2,
  LogIn,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Lightbulb,
  Activity,
  ChevronRight,
  Eye,
  ListChecks,
  Sparkles,
  ClipboardList,
  X,
  BookOpen,
  Edit3,
  Files,
  Download,
  FileSpreadsheet,
  Printer,
  Upload,
  RefreshCw,
  FileBadge2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/verifier/ConnectWallet";
import { IssuerDashboard } from "@/components/verifier/IssuerDashboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  adminLogin,
  saveChecklist,
  updateChecklist,
  duplicateChecklist,
  listChecklists,
  deleteChecklist,
  getChecklist,
  batchVerifyPdf,
  verifySingleReplacement,
  type ChecklistDocEntry,
  type ChecklistTemplate,
  type BatchVerdict,
  type SegmentVerdict,
} from "@/lib/org.functions";
import { readLocalFile, ACCEPTED } from "@/lib/local-file";

// ─── Route Search Schema & Definition ─────────────────────────────────────────

const orgSearchSchema = z.object({
  template: z.string().optional(),
  mode: z.string().optional(),
});

export const Route = createFileRoute("/org")({
  head: () => ({
    meta: [
      { title: "DocuShield — Organisation Verification Hub" },
      {
        name: "description",
        content:
          "Define document checklists for your organisation. Applicants submit a single combined PDF; AI segments, tamper-checks, and verifies every document in one consolidated report.",
      },
      { property: "og:title", content: "DocuShield — Organisation Hub" },
      { property: "og:type", content: "website" },
    ],
  }),
  validateSearch: orgSearchSchema,
  component: OrgPage,
});

// ─── Types ─────────────────────────────────────────────────────────────────────

type AdminSession = { username: string; orgName: string };
type OrgView = "login" | "dashboard" | "builder";

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH_STAGES = [
  { label: "Ingesting PDF…", progress: 10 },
  { label: "Segmenting pages into documents…", progress: 28 },
  { label: "Running tamper & integrity checks…", progress: 48 },
  { label: "Extracting fields from each segment…", progress: 66 },
  { label: "Mapping against checklist template…", progress: 82 },
  { label: "Computing readiness score…", progress: 94 },
  { label: "Generating consolidated report…", progress: 99 },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function genDocId() {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function makeShareUrl(templateId: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/org?template=${templateId}&mode=submit`;
}

// ─── Small UI helpers (reuse design tokens from existing app) ─────────────────

function StatusBadge({ status }: { status: SegmentVerdict["status"] | "missing" }) {
  const map: Record<SegmentVerdict["status"] | "missing", { bg: string; label: string }> = {
    verified: { bg: "bg-[#dcfce7] text-[#166534]", label: "Verified" },
    warning:  { bg: "bg-[#fef3c7] text-[#92400e]", label: "Warning" },
    rejected: { bg: "bg-[#fde4e1] text-[#991b1b]", label: "Rejected" },
    unmatched:{ bg: "bg-[#f4f3ef] text-[#6b7280]", label: "Unmatched" },
    missing:  { bg: "bg-[#fde4e1] text-[#991b1b]", label: "Missing" },
  };
  const { bg, label } = map[status] ?? map.unmatched;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${bg}`}>
      {label}
    </span>
  );
}

function TamperPill({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    low:    "bg-[#fef3c7] text-[#92400e]",
    medium: "bg-[#fde4e1] text-[#991b1b]",
    high:   "bg-[#fca5a5] text-[#7f1d1d]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${map[level]}`}>
      <ShieldAlert className="h-3 w-3" /> Tamper risk: {level}
    </span>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const bg =
    score >= 80
      ? "bg-[#dcfce7] text-[#166534]"
      : score >= 60
        ? "bg-[#fef3c7] text-[#92400e]"
        : "bg-[#fde4e1] text-[#991b1b]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${bg}`}>
      {score}%
    </span>
  );
}

// ─── Copy-link button ─────────────────────────────────────────────────────────

function CopyLinkBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-full border border-[#eae8e3] bg-[#faf9f7] px-3 py-1.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f4f3ef] transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH RESULT VIEW
// Reuses ProcessingColumn's visual language + adds Page Reference,
// Actionable Quality/Blurry feedback, Confidence Display, Single-Doc Replace,
// and PDF/CSV Export.
// ═══════════════════════════════════════════════════════════════════════════════

function BatchResultView({
  verdict,
  template,
  applicantName,
  onUpdateVerdict,
}: {
  verdict: BatchVerdict;
  template: ChecklistTemplate;
  applicantName: string;
  onUpdateVerdict: (newVerdict: BatchVerdict) => void;
}) {
  const verifySingleFn = useServerFn(verifySingleReplacement);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [replacingMissingName, setReplacingMissingName] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const targetReplaceNameRef = useRef<string>("");
  const targetPageRangeRef = useRef<string>("1");
  const targetIndexRef = useRef<number | null>(null);

  const { segments, missingRequired, duplicates, nameMismatches, readiness, summary } = verdict;
  const verifiedCount = segments.filter((s) => s.status === "verified").length;
  const warningCount  = segments.filter((s) => s.status === "warning").length;
  const rejectedCount = segments.filter((s) => s.status === "rejected" || s.status === "unmatched").length;

  // Single-doc replacement trigger
  const triggerReplace = (docName: string, pageRange: string, index: number | null) => {
    targetReplaceNameRef.current = docName;
    targetPageRangeRef.current = pageRange;
    targetIndexRef.current = index;
    if (index !== null) setReplacingIndex(index);
    else setReplacingMissingName(docName);
    replaceInputRef.current?.click();
  };

  const handleFileReplaced = async (file: File) => {
    const docName = targetReplaceNameRef.current;
    const pageRange = targetPageRangeRef.current;
    const idx = targetIndexRef.current;

    try {
      const local = await readLocalFile(file);
      toast.info(`Analyzing replaced ${docName}…`);

      const newSegment = await verifySingleFn({
        data: {
          templateId: template.id,
          requirementName: docName,
          requirementDescription: template.documents.find((d) => d.name === docName)?.description ?? "",
          applicantName,
          language: "English",
          today: new Date().toISOString().slice(0, 10),
          pageRange,
          file: { name: local.name, mimeType: local.mimeType, dataUrl: local.dataUrl },
        },
      });

      let updatedSegments = [...verdict.segments];
      if (idx !== null && idx >= 0 && idx < updatedSegments.length) {
        updatedSegments[idx] = newSegment;
      } else {
        // Was previously a missing document
        updatedSegments.push(newSegment);
      }

      // Re-calculate missing required documents
      const mandatoryDocs = template.documents.filter((d) => d.mandatory);
      const remainingMissing = mandatoryDocs
        .filter((m) => !updatedSegments.some((s) => (s.matchedRequirement === m.id || s.detectedType.toLowerCase().includes(m.name.toLowerCase())) && s.status !== "rejected"))
        .map((m) => m.name);

      const verifiedMandatory = mandatoryDocs.filter((m) =>
        updatedSegments.some((s) => (s.matchedRequirement === m.id || s.detectedType.toLowerCase().includes(m.name.toLowerCase())) && s.status === "verified"),
      ).length;

      const warnings = updatedSegments.filter((s) => s.status === "warning").length;
      const rejected = updatedSegments.filter((s) => s.status === "rejected" || s.status === "unmatched").length;

      const newReadiness = Math.max(
        0,
        Math.min(
          100,
          Math.round(100 - remainingMissing.length * 30 - rejected * 20 - warnings * 10),
        ),
      );

      onUpdateVerdict({
        ...verdict,
        segments: updatedSegments,
        missingRequired: remainingMissing,
        readiness: newReadiness,
      });

      toast.success(`${docName} replaced and verified successfully!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to verify replaced document.");
    } finally {
      setReplacingIndex(null);
      setReplacingMissingName(null);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      "Document Type",
      "Page Reference",
      "Status",
      "Confidence (%)",
      "Extracted Name",
      "Document Number",
      "Expiry Date",
      "Tamper Risk",
      "Notes / Issues",
    ];

    const rows = segments.map((s) => [
      `"${s.detectedType.replace(/"/g, '""')}"`,
      `"p.${s.pageRange}"`,
      `"${s.status}"`,
      `"${s.confidence}%"`,
      `"${(s.extractedName || "").replace(/"/g, '""')}"`,
      `"${(s.documentNumber || "").replace(/"/g, '""')}"`,
      `"${s.expiryDate || ""}"`,
      `"${s.tamperFlag?.level || "None"}"`,
      `"${(s.issues.join("; ") || s.insight || "").replace(/"/g, '""')}"`,
    ]);

    missingRequired.forEach((m) => {
      rows.push([
        `"${m.replace(/"/g, '""')}"`,
        `"—"`,
        `"Missing"`,
        `"0%"`,
        `"—"`,
        `"—"`,
        `"—"`,
        `"None"`,
        `"Required document not found in PDF"`,
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DocuShield-Report-${template.name.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded!");
  };

  // PDF Export / Print
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4 mt-6">
      {/* ── Readiness score + Export Actions ── */}
      <section className="rounded-2xl border border-[#eae8e3] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0a0a0a]">
              <Activity className="h-4 w-4 text-[#0a0a0a]" /> Batch Verification Report
            </h2>
            <p className="mt-1 text-xs text-[#6b7280]">
              {segments.length} document{segments.length !== 1 ? "s" : ""} analyzed in PDF · {template.name}
            </p>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[#eae8e3] bg-[#faf9f7] text-[#0a0a0a] hover:bg-[#f4f3ef] text-xs h-8 px-3"
                onClick={handleExportCsv}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-[#166534]" /> Export CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[#eae8e3] bg-[#faf9f7] text-[#0a0a0a] hover:bg-[#f4f3ef] text-xs h-8 px-3"
                onClick={handlePrintPdf}
              >
                <Printer className="h-3.5 w-3.5 mr-1" /> Download PDF / Print
              </Button>
            </div>
            <div className="text-right pl-3 border-l border-[#f0eee8]">
              <span className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
                {readiness}%
              </span>
              <span className="block text-[11px] font-medium text-[#6b7280]">Readiness</span>
            </div>
          </div>
        </div>
        <Progress value={readiness} className="mt-3.5 h-2 bg-[#eae8e3]" />
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]">
            <CheckCircle2 className="h-3 w-3" /> {verifiedCount} verified
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-semibold text-[#92400e]">
            <AlertTriangle className="h-3 w-3" /> {warningCount} flagged
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fde4e1] px-2.5 py-1 text-[11px] font-semibold text-[#991b1b]">
            <XCircle className="h-3 w-3" /> {rejectedCount} rejected / unmatched
          </span>
        </div>
      </section>

      {/* ── Status table with Page Reference & Confidence column ── */}
      <section className="rounded-2xl border border-[#eae8e3] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="border-b border-[#f0eee8] px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">
            Document Status Table
          </span>
          <span className="text-[11px] text-[#6b7280]">AI Confidence &amp; Segment Analysis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f5f4ef] bg-[#faf9f7]">
                <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">Document Type</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">Page Ref.</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">AI Confidence</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">Notes &amp; Quality Feedback</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#6b7280]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f4ef]">
              {segments.map((seg, i) => {
                const isBlurryOrLowQuality =
                  seg.issues.some((iss) => /blur|quality|unreadable|illegible|poor/i.test(iss)) ||
                  /blur|quality|unreadable|illegible|poor/i.test(seg.insight) ||
                  (seg.confidence < 65 && seg.status !== "verified");

                const needsAttention = seg.status !== "verified";
                const isBusy = replacingIndex === i;

                return (
                  <tr key={i} className="hover:bg-[#faf9f7] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#0a0a0a]">
                      {seg.detectedType}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] font-mono">
                      {seg.pageRange.startsWith("p.") ? seg.pageRange : `p.${seg.pageRange}`}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={seg.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge score={seg.confidence} />
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] max-w-sm">
                      <div className="space-y-1">
                        {isBlurryOrLowQuality && (
                          <p className="rounded-lg bg-[#fef3c7] p-1.5 text-[11px] font-medium text-[#92400e] border border-[#fde68a]">
                            ⚠️ This page is too blurry to verify clearly. Please re-upload a clearer scan of this document.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {seg.tamperFlag && <TamperPill level={seg.tamperFlag.level} />}
                          {seg.isExpired && (
                            <span className="rounded-full bg-[#fde4e1] px-2 py-0.5 text-[10px] font-semibold text-[#991b1b]">
                              Expired
                            </span>
                          )}
                          {seg.issues.slice(0, 2).map((iss) => (
                            <span key={iss} className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] text-[#92400e]">
                              {iss}
                            </span>
                          ))}
                          {!isBlurryOrLowQuality && seg.issues.length === 0 && !seg.tamperFlag && !seg.isExpired && (
                            <span className="text-[#166534] font-medium text-[11px]">✓ All checks passed</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {needsAttention ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => triggerReplace(seg.detectedType, seg.pageRange, i)}
                          className="rounded-full border-[#eae8e3] bg-[#faf9f7] text-[#0a0a0a] hover:bg-[#f4f3ef] text-[11px] h-7 px-3 shrink-0"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Upload className="h-3 w-3 mr-1" />
                          )}
                          Replace document
                        </Button>
                      ) : (
                        <span className="text-[#9ca3af] text-[11px]">✓ Accepted</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Missing mandatory docs as actionable rows */}
              {missingRequired.map((name) => {
                const isBusy = replacingMissingName === name;
                return (
                  <tr key={`missing-${name}`} className="bg-[#fdf9f9]">
                    <td className="px-4 py-3 font-semibold text-[#991b1b]">{name}</td>
                    <td className="px-4 py-3 text-[#9ca3af] font-mono">—</td>
                    <td className="px-4 py-3">
                      <StatusBadge status="missing" />
                    </td>
                    <td className="px-4 py-3 text-[#9ca3af]">—</td>
                    <td className="px-4 py-3 text-[#991b1b] text-[11px] font-medium">
                      Required document not found in PDF submission.
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => triggerReplace(name, "Replaced", null)}
                        className="rounded-full border-[#fca5a5] bg-white text-[#991b1b] hover:bg-[#fde4e1] text-[11px] h-7 px-3"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Upload className="h-3 w-3 mr-1" />
                        )}
                        Upload document
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hidden file input for single-doc replacement */}
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFileReplaced(f);
          e.target.value = "";
        }}
      />

      {/* ── Alerts: duplicates + name mismatches ── */}
      {(duplicates.length > 0 || nameMismatches.length > 0) && (
        <section className="space-y-2">
          {duplicates.length > 0 && (
            <div className="rounded-2xl border border-[#fef3c7] bg-[#fffbeb] px-4 py-3 text-xs font-medium text-[#92400e] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Duplicate documents detected:</strong> {duplicates.join(", ")} — only the first occurrence was evaluated.
              </span>
            </div>
          )}
          {nameMismatches.map((m) => (
            <div key={m} className="rounded-2xl border border-[#fde4e1] bg-[#fdf9f9] px-4 py-3 text-xs font-medium text-[#991b1b] flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{m}</span>
            </div>
          ))}
        </section>
      )}

      {/* ── Per-segment detail cards (mirrors ProcessingColumn cards) ── */}
      {segments.map((seg, i) => {
        const Icon =
          seg.status === "verified" ? CheckCircle2 : seg.status === "warning" ? AlertTriangle : XCircle;
        const iconColor =
          seg.status === "verified" ? "text-emerald-600" : seg.status === "warning" ? "text-amber-600" : "text-red-600";

        const isBlurryOrLowQuality =
          seg.issues.some((iss) => /blur|quality|unreadable|illegible|poor/i.test(iss)) ||
          /blur|quality|unreadable|illegible|poor/i.test(seg.insight) ||
          (seg.confidence < 65 && seg.status !== "verified");

        return (
          <section
            key={i}
            className="rounded-2xl border border-[#eae8e3] bg-white p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              <span className="font-bold text-[#0a0a0a] text-sm">{seg.detectedType}</span>
              <StatusBadge status={seg.status} />
              <span className="rounded-full bg-[#f4f3ef] px-2 py-0.5 text-[11px] text-[#6b7280] font-mono">
                Page {seg.pageRange}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <ConfidenceBadge score={seg.confidence} />
                {seg.status !== "verified" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => triggerReplace(seg.detectedType, seg.pageRange, i)}
                    className="rounded-full border-[#eae8e3] text-xs h-7 px-3"
                  >
                    <Upload className="h-3 w-3 mr-1" /> Replace
                  </Button>
                )}
              </div>
            </div>

            {(seg.extractedName || seg.documentNumber) && (
              <div className="flex flex-wrap gap-3 text-xs">
                {seg.extractedName && (
                  <span className="text-[#6b7280]">
                    Name: <strong className="text-[#0a0a0a]">{seg.extractedName}</strong>
                  </span>
                )}
                {seg.documentNumber && (
                  <span className="text-[#6b7280]">
                    Doc#: <strong className="text-[#0a0a0a] font-mono">{seg.documentNumber}</strong>
                  </span>
                )}
                {seg.expiryDate && (
                  <span className={seg.isExpired ? "text-[#991b1b] font-semibold" : "text-[#6b7280]"}>
                    Expiry: <strong>{seg.expiryDate}{seg.isExpired ? " ⚠ EXPIRED" : ""}</strong>
                  </span>
                )}
              </div>
            )}

            {isBlurryOrLowQuality && (
              <div className="rounded-xl bg-[#fef3c7] p-3 text-xs font-medium text-[#92400e] border border-[#fde68a] flex items-center justify-between gap-2">
                <span>⚠️ This page is too blurry to verify clearly. Please re-upload a clearer scan of this document.</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => triggerReplace(seg.detectedType, seg.pageRange, i)}
                  className="rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] text-[11px] h-7 px-3 shrink-0"
                >
                  <Upload className="h-3 w-3 mr-1" /> Re-upload
                </Button>
              </div>
            )}

            {seg.tamperFlag && (
              <div className="rounded-xl bg-[#fde4e1] px-3.5 py-2.5 text-xs">
                <p className="flex items-center gap-1.5 font-bold text-[#991b1b] mb-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Tamper heuristic flag — {seg.tamperFlag.level} risk (best-effort, not forensic)
                </p>
                <ul className="space-y-0.5 text-[#991b1b]">
                  {seg.tamperFlag.findings.map((f) => (
                    <li key={f} className="flex gap-1.5">
                      <span>·</span><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {seg.issues.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {seg.issues.map((iss) => (
                  <li
                    key={iss}
                    className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-medium text-[#92400e]"
                  >
                    {iss}
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-xl bg-[#faf9f7] border border-[#eae8e3] p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0a0a0a]">
                <Lightbulb className="h-3.5 w-3.5 text-[#0a0a0a]" /> AI insight &amp; recommendations
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4b5563]">{seg.insight}</p>
              {seg.fixSteps.length > 0 && (
                <ol className="mt-2.5 space-y-1 text-xs text-[#0a0a0a]">
                  {seg.fixSteps.map((s, si) => (
                    <li key={s} className="flex gap-2">
                      <span className="font-bold">{si + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        );
      })}

      {/* ── Overall AI Summary ── */}
      {summary && (
        <section className="rounded-2xl border border-[#eae8e3] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <p className="flex items-center gap-2 text-sm font-bold text-[#0a0a0a] mb-2">
            <Sparkles className="h-4 w-4" /> Overall Summary
          </p>
          <p className="text-sm leading-relaxed text-[#4b5563]">{summary}</p>
        </section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICANT SUBMISSION VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ApplicantSubmitView({ templateId }: { templateId: string }) {
  const getChecklistFn  = useServerFn(getChecklist);
  const batchVerifyFn   = useServerFn(batchVerifyPdf);

  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading]   = useState(true);
  const [applicantName, setApplicantName] = useState("");
  const [stageIdx, setStageIdx] = useState(-1);
  const [verdict, setVerdict]   = useState<BatchVerdict | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger load once
  const [templateLoaded, setTemplateLoaded] = useState(false);
  if (!templateLoaded) {
    setTemplateLoaded(true);
    getChecklistFn({ data: { id: templateId } })
      .then((t) => { setTemplate(t); setLoading(false); })
      .catch(() => setLoading(false));
  }

  const processPdf = useCallback(
    async (file: File) => {
      if (!template) return;
      setFileName(file.name);
      setVerdict(null);
      setStageIdx(0);

      const local = await readLocalFile(file);

      // Animate through stages while the AI call runs
      let idx = 0;
      const interval = setInterval(() => {
        idx = Math.min(idx + 1, BATCH_STAGES.length - 1);
        setStageIdx(idx);
      }, 1400);

      try {
        const result = await batchVerifyFn({
          data: {
            templateId: template.id,
            applicantName,
            language: "English",
            today: new Date().toISOString().slice(0, 10),
            file: { name: local.name, mimeType: local.mimeType, dataUrl: local.dataUrl },
          },
        });
        clearInterval(interval);
        setStageIdx(-1);
        setVerdict(result);
      } catch (e) {
        clearInterval(interval);
        setStageIdx(-1);
        toast.error(e instanceof Error ? e.message : "Batch verification failed");
      }
    },
    [template, applicantName, batchVerifyFn],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type === "application/pdf") void processPdf(file);
      else toast.error("Please upload a PDF file.");
    },
    [processPdf],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6b7280]" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="rounded-3xl border border-[#fde4e1] bg-[#fdf9f9] p-10 text-center">
        <XCircle className="mx-auto h-10 w-10 text-[#991b1b]" />
        <h2 className="mt-4 text-xl font-bold text-[#0a0a0a]">Template not found</h2>
        <p className="mt-2 text-sm text-[#6b7280]">
          This submission link may be invalid or expired (templates are in-memory for demo).
        </p>
      </div>
    );
  }

  const mandatoryCount = template.documents.filter((d) => d.mandatory).length;
  const processing = stageIdx >= 0;
  const currentStage = BATCH_STAGES[stageIdx] ?? { label: "", progress: 0 };

  return (
    <div className="space-y-6">
      {/* Template info card */}
      <div className="rounded-3xl border border-[#eae8e3] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a0a0a] shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0a0a0a]">{template.name}</h2>
            <p className="text-xs text-[#6b7280]">{template.orgName} · {mandatoryCount} mandatory document{mandatoryCount !== 1 ? "s" : ""} required</p>
          </div>
        </div>

        {/* Required docs checklist preview */}
        <ul className="mt-4 space-y-2">
          {template.documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2 text-xs text-[#0a0a0a]">
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  doc.mandatory ? "bg-[#0a0a0a] text-white" : "bg-[#f4f3ef] text-[#6b7280]"
                }`}
              >
                {doc.mandatory ? "R" : "O"}
              </span>
              <span className="font-medium">{doc.name}</span>
              {doc.description && (
                <span className="text-[#6b7280] truncate max-w-xs hidden sm:inline">{doc.description}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Applicant name input */}
      {!verdict && (
        <div className="rounded-2xl border border-[#eae8e3] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <Label htmlFor="applicant-name-submit" className="text-xs font-semibold text-[#0a0a0a]">
            Your full name (for cross-document name matching)
          </Label>
          <Input
            id="applicant-name-submit"
            className="mt-2 h-9 rounded-xl border-[#eae8e3] bg-[#faf9f7] text-sm"
            placeholder="e.g. Priya Sharma"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            disabled={processing}
          />
        </div>
      )}

      {/* Upload zone */}
      {!verdict && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed transition-all p-10 text-center cursor-pointer ${
            dragOver
              ? "border-[#0a0a0a] bg-[#f4f3ef]"
              : "border-[#eae8e3] bg-white hover:border-[#0a0a0a] hover:bg-[#faf9f7]"
          }`}
          onClick={() => !processing && fileInputRef.current?.click()}
        >
          {processing ? (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0a0a0a]" />
              <p className="text-sm font-semibold text-[#0a0a0a]">{currentStage.label}</p>
              <p className="text-xs text-[#6b7280]">{fileName}</p>
              <Progress value={currentStage.progress} className="max-w-sm mx-auto h-1.5 bg-[#eae8e3]" />
              <p className="text-[11px] text-[#9ca3af]">
                AI is segmenting and verifying all documents — this may take up to 30 seconds
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f3ef] border border-[#eae8e3]">
                <UploadCloud className="h-7 w-7 text-[#0a0a0a]" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#0a0a0a]">
                Upload a single PDF containing all {mandatoryCount} required documents
              </p>
              <p className="mt-1.5 text-xs text-[#6b7280]">
                Drag &amp; drop or click to browse · PDF only · All pages will be analysed
              </p>
              <Button
                type="button"
                className="mt-5 rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] px-6 h-10 font-semibold shadow-none"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" /> Choose PDF
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processPdf(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Result */}
      {verdict && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0a0a0a]">
              Verification complete for: <span className="font-mono text-[#6b7280]">{fileName}</span>
            </h3>
            <button
              type="button"
              onClick={() => { setVerdict(null); setFileName(null); }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a0a0a] hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Submit new PDF
            </button>
          </div>
          <BatchResultView
            verdict={verdict}
            template={template}
            applicantName={applicantName}
            onUpdateVerdict={(v) => setVerdict(v)}
          />
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKLIST BUILDER (Supports Create & Edit)
// ═══════════════════════════════════════════════════════════════════════════════

function ChecklistBuilder({
  session,
  initialTemplate,
  onSaved,
  onCancel,
}: {
  session: AdminSession;
  initialTemplate?: ChecklistTemplate | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const saveChecklistFn   = useServerFn(saveChecklist);
  const updateChecklistFn = useServerFn(updateChecklist);

  const isEditing = !!initialTemplate;

  const [templateName, setTemplateName] = useState(initialTemplate?.name ?? "");
  const [docs, setDocs] = useState<ChecklistDocEntry[]>(
    initialTemplate?.documents && initialTemplate.documents.length > 0
      ? initialTemplate.documents
      : [
          { id: genDocId(), name: "", mandatory: true, expiryCheck: false, crossMatch: true, keywords: "", description: "" },
        ],
  );

  const addDoc = () =>
    setDocs((prev) => [
      ...prev,
      { id: genDocId(), name: "", mandatory: true, expiryCheck: false, crossMatch: false, keywords: "", description: "" },
    ]);

  const removeDoc = (id: string) =>
    setDocs((prev) => prev.filter((d) => d.id !== id));

  const updateDoc = (id: string, patch: Partial<ChecklistDocEntry>) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing && initialTemplate) {
        return updateChecklistFn({
          data: {
            id: initialTemplate.id,
            name: templateName.trim(),
            orgName: session.orgName,
            documents: docs.filter((d) => d.name.trim()),
          },
        });
      } else {
        return saveChecklistFn({
          data: {
            name: templateName.trim(),
            createdBy: session.username,
            orgName: session.orgName,
            documents: docs.filter((d) => d.name.trim()),
          },
        });
      }
    },
    onSuccess: ({ id }) => {
      toast.success(isEditing ? "Template updated successfully!" : "Checklist template saved!");
      onSaved(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = templateName.trim().length > 0 && docs.some((d) => d.name.trim());

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6b7280] hover:text-[#0a0a0a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="text-lg font-bold text-[#0a0a0a]">
          {isEditing ? "Edit Verification Requirement" : "Create Verification Requirement"}
        </h2>
      </div>

      {/* Template name */}
      <div className="rounded-2xl border border-[#eae8e3] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <Label htmlFor="tpl-name" className="text-xs font-semibold text-[#0a0a0a]">
          Template name
        </Label>
        <Input
          id="tpl-name"
          className="mt-2 h-9 rounded-xl border-[#eae8e3] bg-[#faf9f7] text-sm"
          placeholder="e.g. B.Tech Admission 2026"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>

      {/* Document rows */}
      <div className="rounded-2xl border border-[#eae8e3] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0a0a0a]">Required documents</h3>
          <button
            type="button"
            onClick={addDoc}
            className="inline-flex items-center gap-1 rounded-full bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#262626] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add document
          </button>
        </div>

        <div className="space-y-4">
          {docs.map((doc, idx) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-[#eae8e3] bg-[#faf9f7] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                  Document {idx + 1}
                </span>
                {docs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[#6b7280] hover:bg-[#ebe9e4] hover:text-[#991b1b] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#0a0a0a]">Document name / type *</Label>
                  <Input
                    className="h-9 rounded-xl border-[#eae8e3] bg-white text-xs"
                    placeholder="e.g. PAN Card, 10th Marksheet"
                    value={doc.name}
                    onChange={(e) => updateDoc(doc.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#0a0a0a]">Keywords / hints for AI</Label>
                  <Input
                    className="h-9 rounded-xl border-[#eae8e3] bg-white text-xs"
                    placeholder="e.g. Permanent Account Number, NSDL"
                    value={doc.keywords}
                    onChange={(e) => updateDoc(doc.id, { keywords: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#0a0a0a]">Description for applicant</Label>
                <Input
                  className="h-9 rounded-xl border-[#eae8e3] bg-white text-xs"
                  placeholder="e.g. Clear copy showing DOB and photograph"
                  value={doc.description}
                  onChange={(e) => updateDoc(doc.id, { description: e.target.value })}
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#0a0a0a]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-[#0a0a0a]"
                    checked={doc.mandatory}
                    onChange={(e) => updateDoc(doc.id, { mandatory: e.target.checked })}
                  />
                  Mandatory
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#0a0a0a]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-[#0a0a0a]"
                    checked={doc.expiryCheck}
                    onChange={(e) => updateDoc(doc.id, { expiryCheck: e.target.checked })}
                  />
                  Validate expiry date
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#0a0a0a]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-[#0a0a0a]"
                    checked={doc.crossMatch}
                    onChange={(e) => updateDoc(doc.id, { crossMatch: e.target.checked })}
                  />
                  Cross-match applicant name
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-4 border-t border-[#f0eee8]">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#eae8e3] text-xs h-9 px-5"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] text-xs h-9 px-6 shadow-none"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEditing ? "Save changes" : "Save template"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function AdminDashboard({
  session,
  onCreateNew,
  onEditTemplate,
}: {
  session: AdminSession;
  onCreateNew: () => void;
  onEditTemplate: (tpl: ChecklistTemplate) => void;
}) {
  const listChecklistsFn      = useServerFn(listChecklists);
  const deleteChecklistFn     = useServerFn(deleteChecklist);
  const duplicateChecklistFn  = useServerFn(duplicateChecklist);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loaded, setLoaded]       = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "registry">("templates");

  const refresh = useCallback(async () => {
    const data = await listChecklistsFn({ data: { username: session.username } });
    setTemplates(data);
    setLoaded(true);
  }, [session.username, listChecklistsFn]);

  // Load on mount (once)
  const [fetched, setFetched] = useState(false);
  if (!fetched) {
    setFetched(true);
    void refresh();
  }

  const handleDelete = async (id: string) => {
    await deleteChecklistFn({ data: { id, username: session.username } });
    toast.success("Template deleted");
    void refresh();
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateChecklistFn({ data: { id, username: session.username } });
      toast.success(`Template duplicated as "${duplicated.name}"!`);
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to duplicate template.");
    }
  };

  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-[#0a0a0a] p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Organisation dashboard</p>
            <h2 className="mt-1 text-xl font-bold">{session.orgName}</h2>
            <p className="mt-1 text-xs text-white/50">Logged in as: {session.username}</p>
          </div>
          <Button
            type="button"
            onClick={onCreateNew}
            className="rounded-full bg-white text-[#0a0a0a] hover:bg-gray-100 text-xs h-9 px-5 font-semibold shrink-0 shadow-none"
          >
            <Plus className="h-4 w-4 mr-1" /> New template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#eae8e3] px-2 mb-6">
        <button
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "templates" ? "text-[#0a0a0a]" : "text-[#6b7280] hover:text-[#0a0a0a]"
          }`}
          onClick={() => setActiveTab("templates")}
        >
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Verification Templates
          </span>
          {activeTab === "templates" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a0a0a] rounded-t-full" />
          )}
        </button>
        <button
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "registry" ? "text-[#0a0a0a]" : "text-[#6b7280] hover:text-[#0a0a0a]"
          }`}
          onClick={() => setActiveTab("registry")}
        >
          <span className="flex items-center gap-2">
            <FileBadge2 className="h-4 w-4" /> My Registered Documents
          </span>
          {activeTab === "registry" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a0a0a] rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "templates" ? (
        <>
          {/* Templates list */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a0a0a] mb-3">
              <ListChecks className="h-4 w-4" /> Verification templates
              <span className="rounded-full bg-[#f4f3ef] px-2 py-0.5 text-xs font-semibold text-[#6b7280]">
                {templates.length}
              </span>
            </h3>

        {!loaded ? (
          <div className="flex items-center gap-2 text-sm text-[#6b7280] py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eae8e3] bg-[#faf9f7] py-12 px-6 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-[#9ca3af]" />
            <p className="mt-3 text-sm font-semibold text-[#0a0a0a]">No templates yet</p>
            <p className="mt-1 text-xs text-[#6b7280]">Create a template to get a shareable link for applicants.</p>
            <Button
              type="button"
              onClick={onCreateNew}
              className="mt-4 rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] text-xs h-9 px-5 shadow-none"
            >
              <Plus className="h-4 w-4 mr-1" /> Create first template
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => {
              const shareUrl = makeShareUrl(tpl.id);
              const mandatory = tpl.documents.filter((d) => d.mandatory).length;
              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-[#eae8e3] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#0a0a0a] text-sm">{tpl.name}</h4>
                      <p className="mt-0.5 text-xs text-[#6b7280]">
                        {mandatory} mandatory · {tpl.documents.length - mandatory} optional ·{" "}
                        {new Date(tpl.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEditTemplate(tpl)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#eae8e3] bg-[#faf9f7] px-2.5 py-1 text-xs font-medium text-[#0a0a0a] hover:bg-[#f4f3ef] transition-colors"
                        title="Edit template"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>

                      {/* Duplicate Button */}
                      <button
                        type="button"
                        onClick={() => handleDuplicate(tpl.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#eae8e3] bg-[#faf9f7] px-2.5 py-1 text-xs font-medium text-[#0a0a0a] hover:bg-[#f4f3ef] transition-colors"
                        title="Duplicate template"
                      >
                        <Files className="h-3 w-3" /> Duplicate
                      </button>

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewId(previewId === tpl.id ? null : tpl.id)}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[#6b7280] hover:bg-[#f4f3ef] transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(tpl.id)}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[#6b7280] hover:bg-[#fde4e1] hover:text-[#991b1b] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Share link */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-[#f5f4ef]">
                    <span className="text-xs text-[#6b7280] font-mono truncate flex-1 min-w-0">
                      {shareUrl}
                    </span>
                    <CopyLinkBtn url={shareUrl} />
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[#eae8e3] bg-[#faf9f7] px-3 py-1.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f4f3ef] transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" /> Open applicant view
                    </a>
                  </div>

                  {/* Preview of docs */}
                  {previewId === tpl.id && (
                    <div className="mt-3 pt-3 border-t border-[#f5f4ef]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-2">Documents in this template</p>
                      <ul className="space-y-1.5">
                        {tpl.documents.map((doc) => (
                          <li key={doc.id} className="flex items-center gap-2 text-xs">
                            <span
                              className={`h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                doc.mandatory ? "bg-[#0a0a0a] text-white" : "bg-[#f4f3ef] text-[#6b7280]"
                              }`}
                            >
                              {doc.mandatory ? "R" : "O"}
                            </span>
                            <span className="font-medium text-[#0a0a0a]">{doc.name}</span>
                            {doc.expiryCheck && <span className="text-[#6b7280]">· expiry check</span>}
                            {doc.crossMatch && <span className="text-[#6b7280]">· name match</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

          {/* Hint */}
          <div className="rounded-2xl border border-[#eae8e3] bg-[#faf9f7] px-4 py-3.5 text-xs text-[#6b7280] flex items-start gap-2">
            <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-[#0a0a0a]" />
            <span>
              Share the applicant link with your applicants. They upload <strong className="text-[#0a0a0a]">one combined PDF</strong> containing all required documents.
              DocuShield's AI will segment, tamper-check, and verify each document automatically.
            </span>
          </div>
        </>
      ) : (
        <IssuerDashboard />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN FORM
// ═══════════════════════════════════════════════════════════════════════════════

function LoginForm({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const adminLoginFn = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const login = useMutation({
    mutationFn: () => adminLoginFn({ data: { username: username.trim(), password } }),
    onSuccess: (result) => {
      if (result.ok) {
        onLogin({ username: result.username, orgName: result.orgName });
      } else {
        setError("Invalid username or password.");
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-3xl border border-[#eae8e3] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a0a0a]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0a0a0a]">Organisation Login</h2>
            <p className="text-xs text-[#6b7280]">Admin access only</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="org-username" className="text-xs font-semibold text-[#0a0a0a]">Username</Label>
            <Input
              id="org-username"
              className="h-10 rounded-xl border-[#eae8e3] bg-[#faf9f7] text-sm"
              placeholder="e.g. admin1"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && username && password) login.mutate(); }}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-password" className="text-xs font-semibold text-[#0a0a0a]">Password</Label>
            <Input
              id="org-password"
              type="password"
              className="h-10 rounded-xl border-[#eae8e3] bg-[#faf9f7] text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && username && password) login.mutate(); }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[#fde4e1] px-3 py-2 text-xs font-medium text-[#991b1b]">
              {error}
            </p>
          )}

          <Button
            type="button"
            className="w-full h-10 rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] font-semibold shadow-none"
            disabled={!username || !password || login.isPending}
            onClick={() => login.mutate()}
          >
            {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </Button>
        </div>

        <div className="mt-5 rounded-xl bg-[#faf9f7] border border-[#eae8e3] px-3.5 py-3 text-[11px] text-[#6b7280]">
          <p className="font-semibold text-[#0a0a0a] mb-1">Demo credentials (any of):</p>
          <p>admin1 / DocuShield@2026</p>
          <p>admin2 / Verifier#Admin2</p>
          <p>admin3 / OrgCheck$2026</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function OrgPage() {
  const { template: templateParam, mode } = Route.useSearch();

  // If applicant submission mode, show submit view directly
  const isApplicantMode = mode === "submit" && !!templateParam;

  const [session, setSession] = useState<AdminSession | null>(null);
  const [view, setView]       = useState<OrgView>("login");
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  const handleLogin = (s: AdminSession) => {
    setSession(s);
    setView("dashboard");
    toast.success(`Welcome, ${s.orgName}!`);
  };

  const handleStartCreate = () => {
    setEditingTemplate(null);
    setView("builder");
  };

  const handleStartEdit = (tpl: ChecklistTemplate) => {
    setEditingTemplate(tpl);
    setView("builder");
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#0a0a0a]">
      {/* ── Navbar ── */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" className="site-nav__logo">
            <ShieldCheck size={22} strokeWidth={2.4} color="#0a0a0a" />
            <span className="site-nav__wordmark">DocuShield</span>
            <span className="site-nav__badge">ORG</span>
          </Link>

          <div className="site-nav__links">
            <Link to="/" className="site-nav__link">Home</Link>
            <Link to="/app" className="site-nav__link">Workspace</Link>
            <Link to="/org" className="site-nav__link site-nav__link--active">Organization</Link>
          </div>

          <Link to="/" className="site-nav__cta">
            <ArrowLeft size={14} /> Back to Overview
          </Link>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-4xl px-5 pb-28 pt-10">
        {/* Page header */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#eae8e3] bg-white px-3.5 py-1 text-xs font-semibold text-[#0a0a0a] shadow-xs">
            <Building2 className="h-3.5 w-3.5" />{" "}
            {isApplicantMode ? "Document Submission Portal" : "Organisation Verification Hub"}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-[#0a0a0a]">
            {isApplicantMode ? "Submit your documents" : "Organisation Admin Panel"}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {isApplicantMode
              ? "Upload a single PDF with all required documents. Our AI will verify each one automatically."
              : "Define document checklists · Generate applicant submission links · Review batch verification reports"}
          </p>
        </section>

        {/* Content router */}
        {isApplicantMode ? (
          <ApplicantSubmitView templateId={templateParam!} />
        ) : session === null ? (
          <LoginForm onLogin={handleLogin} />
        ) : view === "builder" ? (
          <ChecklistBuilder
            session={session}
            initialTemplate={editingTemplate}
            onSaved={(_id) => {
              setEditingTemplate(null);
              setView("dashboard");
            }}
            onCancel={() => {
              setEditingTemplate(null);
              setView("dashboard");
            }}
          />
        ) : (
          <AdminDashboard
            session={session}
            onCreateNew={handleStartCreate}
            onEditTemplate={handleStartEdit}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-16 max-w-4xl border-t border-[#eae8e3] px-5 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6b7280]">
        <div>DocuShield · Organisation Module · Spiderverse Hackathon 2026</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-[#fef3c7] px-2 py-0.5 rounded-full text-[10px]">
            <ShieldAlert className="h-3 w-3" /> Demo auth — not production-grade
          </span>
        </div>
      </footer>
    </div>
  );
}
