import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ScanLine, Sparkles, Loader2, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Uploader, type LocalFile } from "@/components/verifier/Uploader";
import { ResultsPanel } from "@/components/verifier/ResultsPanel";
import { verifyDocuments, type VerificationResult } from "@/lib/verify.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocuShield — AI Document Verification by Innovative_Devs" },
      {
        name: "description",
        content:
          "Upload application documents and get instant OCR, classification, rule validation and an application readiness score.",
      },
      { property: "og:title", content: "DocuShield — AI Document Verification" },
      {
        property: "og:description",
        content:
          "Instant OCR, document classification, mismatch and expiry checks, and a readiness score for every application.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DEFAULT_DOCS = [
  "PAN Card",
  "Aadhaar",
  "Address Proof",
  "Business Address Document",
  "Photograph",
];

const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Bengali", "Gujarati"];

const PIPELINE = [
  { label: "Upload", detail: "Drag in scans or photos" },
  { label: "OCR", detail: "Read every field" },
  { label: "Classification", detail: "Identify document type" },
  { label: "Rule validation", detail: "Expiry, quality, mismatch, duplicates" },
  { label: "Result", detail: "Readiness score + actions" },
];

function Home() {
  const [applicantName, setApplicantName] = useState("");
  const [language, setLanguage] = useState("English");
  const [required, setRequired] = useState<string[]>(DEFAULT_DOCS);
  const [customDoc, setCustomDoc] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const run = useServerFn(verifyDocuments);
  const mutation = useMutation({
    mutationFn: () =>
      run({
        data: {
          applicantName,
          language,
          requiredDocs: required,
          files: files.map((f) => ({ name: f.name, mimeType: f.mimeType, dataUrl: f.dataUrl })),
        },
      }),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Analysis complete — ${data.readiness}% ready`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDoc = (doc: string) =>
    setRequired((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));

  const allDocs = Array.from(new Set([...DEFAULT_DOCS, ...required]));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">DocuShield</span>
        </div>
        <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          Team Innovative_Devs · Spiderverse Hackathon 2026
        </span>
      </header>

      <section className="mt-14 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Document Verification &amp; Completeness
          Checker
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
          Catch every <span className="text-gradient">missing, expired or mismatched</span> document
          before the application moves.
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Operations teams lose days chasing paperwork. DocuShield reads each upload, classifies it,
          validates it against your checklist and returns an application readiness score with
          plain-language reasons.
        </p>
      </section>

      <ol className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PIPELINE.map((step, i) => (
          <li key={step.label} className="panel p-4">
            <span className="text-xs text-primary">Step {i + 1}</span>
            <p className="mt-1 font-medium">{step.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="panel p-6">
          <h2 className="text-lg font-semibold">1 · Upload documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Images are analysed in memory and never stored.
          </p>
          <div className="mt-5">
            <Uploader files={files} onChange={setFiles} />
          </div>
        </section>

        <section className="panel space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold">2 · Application details</h2>
            <div className="mt-4 space-y-2">
              <Label htmlFor="applicant">Applicant / business name</Label>
              <Input
                id="applicant"
                placeholder="e.g. Anant Shrivastav"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used to detect name mismatches across documents.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Required checklist</Label>
            <div className="space-y-2">
              {allDocs.map((doc) => (
                <label
                  key={doc}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2 text-sm"
                >
                  <Checkbox checked={required.includes(doc)} onCheckedChange={() => toggleDoc(doc)} />
                  {doc}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add another document"
                value={customDoc}
                onChange={(e) => setCustomDoc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customDoc.trim()) {
                    e.preventDefault();
                    setRequired((p) => Array.from(new Set([...p, customDoc.trim()])));
                    setCustomDoc("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!customDoc.trim()) return;
                  setRequired((p) => Array.from(new Set([...p, customDoc.trim()])));
                  setCustomDoc("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="h-4 w-4" /> Explanation language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={files.length === 0 || required.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reading documents…
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" /> Verify {files.length || ""} document
                {files.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </section>
      </div>

      {result && (
        <div className="mt-12">
          <ResultsPanel result={result} />
        </div>
      )}

      <footer className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Built by Team Innovative_Devs · Spiderverse Hackathon 2026 · ASCAI
      </footer>
    </main>
  );
}
