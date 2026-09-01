import { createFileRoute } from "@tanstack/react-router";
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
      { title: "DocuShield — Find & Verify Documents for Any Service" },
      {
        name: "description",
        content:
          "Search any scheme, licence or service to get its exact document checklist, then upload each document for live OCR, authenticity checks and AI insights on every failure.",
      },
      { property: "og:title", content: "DocuShield — Document Checker for Every Application" },
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
const EXAMPLES = ["Passport (fresh, adult)", "PAN card", "Driving licence renewal", "PM Kisan scheme"];

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
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">DocuShield</span>
        </div>
        <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          Team Innovative_Devs · Spiderverse Hackathon 2026
        </span>
      </header>

      <section className="mx-auto mt-12 max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI document checker for any service or scheme
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
          What are you <span className="text-gradient">applying for</span>?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Search the service to get its exact document checklist — or upload the application form and
          we&apos;ll read it for you.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 pl-10"
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
            className="h-12"
            disabled={query.trim().length < 2 || search.isPending}
            onClick={() => search.mutate()}
          >
            {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find documents
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-12"
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

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          Try:
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="rounded-full border border-border px-3 py-1 hover:border-primary/60 hover:text-foreground"
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

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="h-4 w-4 text-primary" /> Required documents
          </h2>

          {!requirements ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Search a service or scan a form above to build your checklist.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {requirements.serviceName} · {requirements.authority}
              </p>
              {requirements.overview && (
                <p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground">
                  {requirements.overview}
                </p>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="applicant">Applicant name</Label>
                  <Input
                    id="applicant"
                    placeholder="Name as on the application"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                  />
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
                <ul className="mt-5 space-y-1 text-xs text-muted-foreground">
                  {requirements.notes.map((n) => (
                    <li key={n}>• {n}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <ProcessingColumn docs={docs} slots={slots} events={events} />
      </div>

      <Dialog open={digilockerOpen} onOpenChange={setDigilockerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Fetch from DigiLocker
            </DialogTitle>
            <DialogDescription>
              DigiLocker issues documents only to registered partner applications. To enable one-tap
              fetch here, DocuShield needs DigiLocker Partner API credentials (client ID, client
              secret and a whitelisted redirect URL) from the Meri Pehchaan / DigiLocker partner
              portal. Share those and we will wire the consent flow so issued documents arrive
              pre-verified. Until then, download the document from your DigiLocker app and upload it
              here — verification works exactly the same.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <footer className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Built by Team Innovative_Devs · Spiderverse Hackathon 2026 · Documents are analysed in memory
        and never stored.
      </footer>
    </main>
  );
}
