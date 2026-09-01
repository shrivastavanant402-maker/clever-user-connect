import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Search,
  Loader2,
  FileUp,
  Languages,
  ListChecks,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentSlot } from "@/components/verifier/DocumentSlot";
import { ProcessingColumn } from "@/components/verifier/ProcessingColumn";
import { readLocalFile, ACCEPTED } from "@/lib/local-file";
import type { FeedEvent, SlotState, Stage } from "@/lib/upload-state";
import {
  getServiceRequirements,
  scanFormRequirements,
  type ServiceRequirements,
} from "@/lib/requirements.functions";
import { verifyDocument } from "@/lib/verify.functions";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "DocuShield — Live Document Verification Hub" },
      {
        name: "description",
        content:
          "Search any government service or upload an application form. Live OCR, authenticity validation, and real-time AI compliance verification.",
      },
      { property: "og:title", content: "DocuShield — Document Verification Hub" },
      {
        property: "og:description",
        content:
          "Search a service or scan the form, get the required document list, and verify each upload in real time with AI insights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppPage,
});

const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Bengali", "Gujarati"];
const EXAMPLES = [
  "Passport (fresh, adult)",
  "PAN card correction",
  "Driving licence renewal",
  "PM Kisan scheme",
  "GST registration",
];

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function AppPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("English");
  const [applicantName, setApplicantName] = useState("");
  const [requirements, setRequirements] = useState<ServiceRequirements | null>(null);
  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [digilockerOpen, setDigilockerOpen] = useState(false);
  const formInputRef = useRef<HTMLInputElement>(null);

  const searchFn = useServerFn(getServiceRequirements);
  const scanFn = useServerFn(scanFormRequirements);
  const verifyFn = useServerFn(verifyDocument);

  const log = (docName: string, message: string, tone: FeedEvent["tone"] = "info") =>
    setEvents((prev) =>
      [{ id: `${Date.now()}-${Math.random()}`, time: now(), docName, message, tone }, ...prev].slice(
        0,
        60,
      ),
    );

  const applyRequirements = (r: ServiceRequirements) => {
    setRequirements(r);
    setSlots({});
    setEvents([]);
    toast.success(`${r.documents.length} documents required for ${r.serviceName}`);
  };

  const search = useMutation({
    mutationFn: () => searchFn({ data: { query, language } }),
    onSuccess: applyRequirements,
    onError: (e: Error) => toast.error(e.message),
  });

  const scanForm = useMutation({
    mutationFn: async (file: File) => {
      const local = await readLocalFile(file);
      return scanFn({
        data: {
          language,
          file: { name: local.name, mimeType: local.mimeType, dataUrl: local.dataUrl },
        },
      });
    },
    onSuccess: (r) => {
      setQuery(r.serviceName);
      applyRequirements(r);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStage = (docId: string, stage: Stage, patch: Partial<SlotState> = {}) =>
    setSlots((prev) => (prev[docId] ? { ...prev, [docId]: { ...prev[docId], stage, ...patch } } : prev));

  const handlePick = async (docId: string, file: File) => {
    const doc = requirements?.documents.find((d) => d.id === docId);
    if (!doc) return;
    const local = await readLocalFile(file);
    setSlots((prev) => ({ ...prev, [docId]: { file: local, stage: "reading", source: "upload" } }));
    log(doc.name, `Received ${local.name}`);

    const t1 = setTimeout(() => {
      setStage(docId, "ocr");
      log(doc.name, "Running OCR on the scan…");
    }, 400);
    const t2 = setTimeout(() => {
      setStage(docId, "classify");
      log(doc.name, "Classifying document type…");
    }, 1400);
    const t3 = setTimeout(() => {
      setStage(docId, "validate");
      log(doc.name, "Checking expiry, quality, name match and tampering…");
    }, 2600);

    try {
      const verdict = await verifyFn({
        data: {
          requirementName: doc.name,
          requirementDescription: doc.description,
          applicantName,
          serviceName: requirements?.serviceName ?? "",
          language,
          today: new Date().toISOString().slice(0, 10),
          file: { name: local.name, mimeType: local.mimeType, dataUrl: local.dataUrl },
        },
      });
      [t1, t2, t3].forEach(clearTimeout);
      setStage(docId, "done", { verdict });
      log(
        doc.name,
        verdict.status === "verified"
          ? `Verified as ${verdict.detectedType}`
          : `${verdict.status === "warning" ? "Flagged" : "Rejected"}: ${verdict.issues[0] ?? verdict.insight}`,
        verdict.status === "verified" ? "success" : verdict.status === "warning" ? "warning" : "error",
      );
    } catch (e) {
      [t1, t2, t3].forEach(clearTimeout);
      const message = e instanceof Error ? e.message : "Verification failed";
      setStage(docId, "error", { error: message });
      log(doc.name, message, "error");
    }
  };

  const docs = requirements?.documents ?? [];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#0a0a0a]">
      {/* ── Floating Pill Navbar ── */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" className="site-nav__logo">
            <ShieldCheck size={22} strokeWidth={2.4} color="#0a0a0a" />
            <span className="site-nav__wordmark">DocuShield</span>
            <span className="site-nav__badge">VERIFIER</span>
          </Link>

          <div className="site-nav__links">
            <Link to="/" className="site-nav__link">
              Home
            </Link>
            <Link to="/app" className="site-nav__link site-nav__link--active">
              Workspace
            </Link>
            <Link to="/org" className="site-nav__link">
              <Building2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Organization
            </Link>
            <button
              type="button"
              onClick={() => setDigilockerOpen(true)}
              className="site-nav__link"
            >
              DigiLocker
            </button>
          </div>

          <Link to="/" className="site-nav__cta">
            <ArrowLeft size={14} /> Back to Overview
          </Link>
        </div>
      </nav>

      {/* ── App Content ── */}
      <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-8">
        {/* Search header card */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#eae8e3] bg-white px-3.5 py-1 text-xs font-semibold text-[#0a0a0a] shadow-xs">
            <Sparkles className="h-3.5 w-3.5" /> Instant AI Checklist & Verification
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-[#0a0a0a]">
            What are you applying for?
          </h1>
          <p className="mt-2.5 text-sm text-[#6b7280]">
            Enter any scheme, license or service — or scan your application form directly.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                className="h-12 pl-10 rounded-full border-[#eae8e3] bg-white text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
                placeholder="e.g. Apply for a new passport, GST registration, Ayushman Bharat card…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim().length > 1) search.mutate();
                }}
              />
            </div>
            <Button
              size="lg"
              className="h-12 rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] font-semibold px-6 shadow-xs"
              disabled={query.trim().length < 2 || search.isPending}
              onClick={() => search.mutate()}
            >
              {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find documents
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-[#eae8e3] bg-white text-[#0a0a0a] hover:bg-[#f4f3ef] font-semibold px-5 shadow-xs"
              disabled={scanForm.isPending}
              onClick={() => formInputRef.current?.click()}
            >
              {scanForm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Scan a form
            </Button>
            <input
              ref={formInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) scanForm.mutate(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#6b7280]">
            <span className="font-medium">Quick presets:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="rounded-full border border-[#eae8e3] bg-white px-3 py-1 text-xs font-medium text-[#0a0a0a] transition-colors hover:border-[#0a0a0a] hover:bg-[#f4f3ef]"
                onClick={() => {
                  setQuery(ex);
                  search.mutate();
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Requirements and Live Stream Grid */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2 items-start">
          {/* Left: Required Documents Checklist */}
          <section className="rounded-3xl border border-[#eae8e3] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#0a0a0a]">
                <ListChecks className="h-4 w-4 text-[#0a0a0a]" /> Required documents
              </h2>
              {requirements && (
                <span className="rounded-full bg-[#f4f3ef] px-2.5 py-0.5 text-xs font-semibold text-[#0a0a0a]">
                  {docs.length} items
                </span>
              )}
            </div>

            {!requirements ? (
              <div className="mt-8 text-center py-12 px-4 rounded-2xl border border-dashed border-[#eae8e3] bg-[#faf9f7]">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#eae8e3] shadow-xs">
                  <Search className="h-4 w-4 text-[#6b7280]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#0a0a0a]">No checklist active yet</p>
                <p className="mt-1 text-xs text-[#6b7280] max-w-sm mx-auto">
                  Type a service name above (like "Passport") or upload a form to automatically generate the document rules.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg text-[#0a0a0a]">{requirements.serviceName}</span>
                    <span className="text-xs text-[#6b7280]">· {requirements.authority}</span>
                  </div>
                  {requirements.overview && (
                    <p className="mt-2 rounded-xl bg-[#faf9f7] border border-[#eae8e3] p-3 text-xs leading-relaxed text-[#6b7280]">
                      {requirements.overview}
                    </p>
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 bg-[#faf9f7] p-3.5 rounded-2xl border border-[#eae8e3]">
                  <div className="space-y-1.5">
                    <Label htmlFor="applicant" className="text-xs font-semibold text-[#0a0a0a]">
                      Applicant name
                    </Label>
                    <Input
                      id="applicant"
                      className="h-9 rounded-xl border-[#eae8e3] bg-white text-xs"
                      placeholder="e.g. Jane Doe"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-[#0a0a0a]">
                      <Languages className="h-3.5 w-3.5" /> Language
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-9 rounded-xl border-[#eae8e3] bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l} value={l} className="text-xs">
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {docs.map((doc) => (
                    <DocumentSlot
                      key={doc.id}
                      doc={doc}
                      slot={slots[doc.id]}
                      onPick={(file) => void handlePick(doc.id, file)}
                      onRemove={() =>
                        setSlots((prev) => {
                          const next = { ...prev };
                          delete next[doc.id];
                          return next;
                        })
                      }
                      onDigilocker={() => setDigilockerOpen(true)}
                    />
                  ))}
                </ul>

                {requirements.notes.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#f0eee8]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                      Key guidelines
                    </span>
                    <ul className="mt-2 space-y-1 text-xs text-[#6b7280]">
                      {requirements.notes.map((n) => (
                        <li key={n} className="flex gap-2">
                          <span className="text-[#0a0a0a]">•</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Right: Processing Column */}
          <ProcessingColumn docs={docs} slots={slots} events={events} />
        </div>

        {/* DigiLocker Modal */}
        <Dialog open={digilockerOpen} onOpenChange={setDigilockerOpen}>
          <DialogContent className="rounded-3xl border border-[#eae8e3] bg-white p-6 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#0a0a0a]">
                <ShieldCheck className="h-5 w-5 text-[#0a0a0a]" /> DigiLocker Integration
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-[#6b7280] pt-2">
                DigiLocker issues legally recognised documents via Meri Pehchaan OAuth consent flow.
                When configured with partner client credentials, DocuShield pulls verified certificates directly into your checklist.
                <br /><br />
                <strong>For now:</strong> You can download any document from your DigiLocker app and upload it here — OCR and validation work identically!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 pt-3 border-t border-[#f0eee8] flex justify-end">
              <Button
                variant="default"
                className="rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] text-xs h-9 px-4"
                onClick={() => setDigilockerOpen(false)}
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Clean footer */}
        <footer className="mt-24 border-t border-[#eae8e3] pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6b7280]">
          <div>DocuShield · Team Innovative_Devs · Spiderverse Hackathon 2026</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-[#dcfce7] px-2 py-0.5 rounded-full text-[10px]">
              <CheckCircle2 className="h-3 w-3" /> In-Memory Analysis Only
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
