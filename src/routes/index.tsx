import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  Search,
  Zap,
  Lock,
  FileCheck2,
  Cpu,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocuShield — AI Document Verification for Every Service" },
      {
        name: "description",
        content:
          "Instantly verify any document for any government service. AI-powered OCR, authenticity checks, and smart insights — all in one place.",
      },
      { property: "og:title", content: "DocuShield — AI Document Verification" },
      {
        property: "og:description",
        content:
          "Search any service, get the exact document checklist, and verify each upload with AI in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

/* ── Phone Mockup UI ── */
function PhoneMockup() {
  return (
    <div className="landing-phone">
      <div className="landing-phone__bezel">
        {/* Status bar */}
        <div className="landing-phone__status-bar">
          <span className="landing-phone__time">9:41</span>
          <div className="landing-phone__status-icons">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="1" fill="#0a0a0a" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#0a0a0a" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#0a0a0a" />
              <rect x="13" y="3" width="3" height="9" rx="1" fill="#0a0a0a" opacity="0.3" />
            </svg>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <rect x="0.5" y="0.5" width="15" height="9" rx="2" stroke="#0a0a0a" strokeWidth="1" />
              <rect x="2" y="2" width="10" height="6" rx="1" fill="#0a0a0a" />
              <rect x="16" y="3" width="2" height="4" rx="0.5" fill="#0a0a0a" />
            </svg>
          </div>
        </div>

        {/* App header */}
        <div className="landing-phone__header">
          <div className="landing-phone__header-back">
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
          </div>
          <div className="landing-phone__header-title">
            <div className="landing-phone__header-avatar">
              <ShieldCheck size={13} color="#fff" />
            </div>
            <span>DocuShield Live</span>
          </div>
          <div className="landing-phone__header-dots">•••</div>
        </div>

        {/* Scrollable card area */}
        <div className="landing-phone__body">
          {/* Verified card */}
          <div className="landing-phone__card">
            <div className="landing-phone__card-top">
              <div className="landing-phone__card-icon landing-phone__card-icon--green">
                <Check size={14} color="#fff" />
              </div>
              <div className="landing-phone__card-info">
                <span className="landing-phone__card-name">Passport (Fresh)</span>
                <span className="landing-phone__card-sub">Verified · 2 sec ago</span>
              </div>
              <span className="landing-phone__card-badge landing-phone__card-badge--green">
                Verified
              </span>
            </div>
            <div className="landing-phone__card-details">
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Name match</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ 100% Match</span>
              </div>
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Expiry check</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ Valid until 2034</span>
              </div>
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Tampering</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ Clean scan</span>
              </div>
            </div>
          </div>

          {/* Warning card */}
          <div className="landing-phone__card">
            <div className="landing-phone__card-top">
              <div className="landing-phone__card-icon landing-phone__card-icon--amber">
                <AlertTriangle size={14} color="#fff" />
              </div>
              <div className="landing-phone__card-info">
                <span className="landing-phone__card-name">Aadhaar Card</span>
                <span className="landing-phone__card-sub">Flagged · needs review</span>
              </div>
              <span className="landing-phone__card-badge landing-phone__card-badge--amber">
                Warning
              </span>
            </div>
            <div className="landing-phone__card-details">
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Name match</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ Pass</span>
              </div>
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Quality</span>
                <span className="landing-phone__card-value landing-phone__card-value--warn">⚠ Low resolution</span>
              </div>
            </div>
          </div>

          {/* Rejected card */}
          <div className="landing-phone__card">
            <div className="landing-phone__card-top">
              <div className="landing-phone__card-icon landing-phone__card-icon--red">
                <X size={14} color="#fff" />
              </div>
              <div className="landing-phone__card-info">
                <span className="landing-phone__card-name">PAN Card</span>
                <span className="landing-phone__card-sub">Rejected · expired</span>
              </div>
              <span className="landing-phone__card-badge landing-phone__card-badge--red">
                Rejected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ Item Component ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#eae8e3] py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-base font-bold text-[#0a0a0a]"
        onClick={() => setOpen(!open)}
      >
        <span>{question}</span>
        <ChevronDown
          size={18}
          className={`text-[#6b7280] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="mt-2.5 text-sm leading-relaxed text-[#6b7280]">
          {answer}
        </p>
      )}
    </div>
  );
}

/* ── Main Landing Page ── */
function LandingPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Passport & Visa", "Tax & Business", "Driving & Transport", "Welfare Schemes"];

  const presets = [
    { title: "Passport (Fresh Adult)", authority: "Passport Seva Kendra", docs: "4 docs required", link: "/app" },
    { title: "Driving Licence Renewal", authority: "Parivahan / RTO", docs: "3 docs required", link: "/app" },
    { title: "GST Registration", authority: "GSTN Portal", docs: "5 docs required", link: "/app" },
    { title: "PM Kisan Samman Nidhi", authority: "Ministry of Agriculture", docs: "3 docs required", link: "/app" },
    { title: "Ayushman Bharat Card", authority: "National Health Authority", docs: "2 docs required", link: "/app" },
    { title: "PAN Card Correction", authority: "NSDL / Protean", docs: "4 docs required", link: "/app" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#0a0a0a] selection:bg-[#0a0a0a] selection:text-white">
      {/* ── Floating pill navbar ── */}
      <nav className="site-nav" id="landing-nav">
        <div className="site-nav__inner">
          <Link to="/" className="site-nav__logo">
            <ShieldCheck size={22} strokeWidth={2.4} color="#0a0a0a" />
            <span className="site-nav__wordmark">DocuShield</span>
            <span className="site-nav__badge">BETA</span>
          </Link>

          <div className="site-nav__links">
            <a href="#how-it-works" className="site-nav__link">
              How it works
            </a>
            <a href="#features" className="site-nav__link">
              Features
            </a>
            <a href="#schemes" className="site-nav__link">
              Supported schemes
            </a>
            <a href="#faq" className="site-nav__link">
              FAQ
            </a>
          </div>

          <Link to="/app" className="site-nav__cta" id="get-started-btn">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="landing-hero" id="hero-section">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#eae8e3] bg-white px-3.5 py-1 text-xs font-semibold text-[#0a0a0a] shadow-xs">
          <Sparkles className="h-3.5 w-3.5" /> AI Document Verification Engine
        </div>

        <h1 className="landing-hero__headline">
          Verify documents<br />for any service
        </h1>
        <p className="landing-hero__subtext">
          Search any scheme, licence, or government service to get its exact document
          checklist — then upload each one for{" "}
          <strong>live AI verification</strong> with OCR, authenticity checks, and
          smart insights on every result.
        </p>

        <div className="landing-hero__actions">
          <Link to="/app" className="landing-hero__btn-primary" id="hero-cta-btn">
            Start verifying — it&apos;s free
            <ChevronRight size={16} />
          </Link>
          <span className="landing-hero__pill-accent">
            No sign-up required · In-memory processing
          </span>
        </div>

        {/* Phone mockup — bleeds off bottom */}
        <div className="landing-hero__mockup-container">
          <PhoneMockup />
        </div>
      </section>

      {/* ── Quick Sandbox Strip ── */}
      <section className="relative z-10 mx-auto mt-40 max-w-5xl px-5">
        <div className="rounded-3xl border border-[#eae8e3] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                Quick Start Presets
              </span>
              <p className="text-base font-bold text-[#0a0a0a] mt-0.5">
                Try checking requirements for popular services:
              </p>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0a0a0a] hover:underline"
            >
              Open full workspace <ChevronRight size={14} />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              "Passport",
              "Driving Licence",
              "GST Portal",
              "PM Kisan",
              "Ayushman Card",
              "PAN Card",
            ].map((name) => (
              <Link
                key={name}
                to="/app"
                className="group flex flex-col items-center justify-center rounded-2xl border border-[#eae8e3] bg-[#faf9f7] p-3 text-center transition-all hover:border-[#0a0a0a] hover:bg-white hover:shadow-sm"
              >
                <FileCheck2 className="h-4 w-4 text-[#6b7280] group-hover:text-[#0a0a0a] transition-colors" />
                <span className="mt-1.5 text-xs font-bold text-[#0a0a0a] truncate w-full">{name}</span>
                <span className="text-[10px] text-[#9ca3af]">Check list</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (3-Step Cards) ── */}
      <section id="how-it-works" className="mx-auto mt-28 max-w-6xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            Simple 3-step flow
          </span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl text-[#0a0a0a]">
            Eliminate document rejections before you apply
          </h2>
          <p className="mt-3 text-sm text-[#6b7280]">
            DocuShield handles the complete lifecycle from figuring out rules to real-time verification.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div className="rounded-3xl border border-[#eae8e3] bg-white p-7 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block font-mono text-3xl font-extrabold text-[#0a0a0a]">01</span>
              <h3 className="mt-4 text-lg font-bold text-[#0a0a0a]">
                Search or Scan Any Form
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6b7280]">
                Search your scheme name or upload a physical application form. DocuShield reads the authority guidelines and extracts the exact required document checklist.
              </p>
            </div>
            <div className="mt-6 rounded-2xl bg-[#faf9f7] border border-[#eae8e3] p-3 text-xs text-[#0a0a0a] font-medium flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-[#6b7280]" />
              <span>&ldquo;Apply fresh Indian passport&rdquo;</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-[#eae8e3] bg-white p-7 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block font-mono text-3xl font-extrabold text-[#0a0a0a]">02</span>
              <h3 className="mt-4 text-lg font-bold text-[#0a0a0a]">
                Live Multimodal AI Checks
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6b7280]">
                Upload each scan or pull via DigiLocker. AI runs live OCR, cross-checks applicant names, verifies validity dates, and inspects stamps &amp; signatures for authenticity.
              </p>
            </div>
            <div className="mt-6 rounded-2xl bg-[#dcfce7] p-3 text-xs text-[#166534] font-semibold flex items-center justify-between">
              <span>Passport verified · 98% confidence</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-[#eae8e3] bg-white p-7 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block font-mono text-3xl font-extrabold text-[#0a0a0a]">03</span>
              <h3 className="mt-4 text-lg font-bold text-[#0a0a0a]">
                Actionable Fix Guides
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6b7280]">
                If a document fails or has warnings, receive human-readable fix instructions in 6 Indian languages so you can correct errors before submitting to authorities.
              </p>
            </div>
            <div className="mt-6 rounded-2xl bg-[#fde4e1] p-3 text-xs text-[#991b1b] font-semibold flex items-center justify-between">
              <span>Photo mismatch · Replace with 35x45mm</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Bento Grid ── */}
      <section id="features" className="mx-auto mt-28 max-w-6xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            Capabilities
          </span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl text-[#0a0a0a]">
            Engineered for precision &amp; privacy
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Bento Item 1 - Large */}
          <div className="md:col-span-2 rounded-3xl border border-[#eae8e3] bg-white p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf9f7] border border-[#eae8e3]">
                <Zap className="h-5 w-5 text-[#0a0a0a]" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[#0a0a0a]">
                Sub-Second Pipeline Stream
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
                Watch your files stream through reading, OCR analysis, classification, and field matching in real-time. DocuShield classifies whether forms are printed, handwritten, or stamped.
              </p>
            </div>
            <div className="mt-6 rounded-2xl bg-[#faf9f7] border border-[#eae8e3] p-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6b7280]">12:44:02 — Passport.pdf</span>
                <span className="font-bold text-emerald-700">✓ Name &amp; DOB Match Pass</span>
              </div>
            </div>
          </div>

          {/* Bento Item 2 */}
          <div className="rounded-3xl border border-[#eae8e3] bg-white p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf9f7] border border-[#eae8e3]">
                <Lock className="h-5 w-5 text-[#0a0a0a]" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[#0a0a0a]">
                Zero Data Footprint
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
                Documents are analyzed strictly in ephemeral memory and discarded immediately. No database retention, no training on user uploads.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-[#dcfce7] px-3 py-1 rounded-full self-start">
              <Check size={13} /> Bank-Grade Ephemeral
            </span>
          </div>

          {/* Bento Item 3 */}
          <div className="rounded-3xl border border-[#eae8e3] bg-white p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf9f7] border border-[#eae8e3]">
                <Cpu className="h-5 w-5 text-[#0a0a0a]" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[#0a0a0a]">
                Handwriting &amp; Seal Detection
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
                Identifies handwritten additions on government forms, missing attestation seals, and incomplete mandatory entries.
              </p>
            </div>
            <span className="mt-6 text-xs font-semibold text-[#6b7280]">
              Detects 14+ issue types
            </span>
          </div>

          {/* Bento Item 4 - Large */}
          <div className="md:col-span-2 rounded-3xl border border-[#eae8e3] bg-white p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf9f7] border border-[#eae8e3]">
                <Layers className="h-5 w-5 text-[#0a0a0a]" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[#0a0a0a]">
                DigiLocker Ecosystem Ready
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
                Pre-wired for DigiLocker OAuth consent. Pull issued digital documents directly from government repositories with zero upload friction.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Aadhaar", "Driving Licence", "PAN Verification Record", "Class X/XII Marksheets", "Vehicle RC"].map((tag) => (
                <span key={tag} className="rounded-full bg-[#f4f3ef] px-3 py-1 text-xs font-medium text-[#0a0a0a]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Supported Schemes Grid ── */}
      <section id="schemes" className="mx-auto mt-28 max-w-6xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            Comprehensive Database
          </span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl text-[#0a0a0a]">
            Pre-loaded with 100+ public services
          </h2>
          <p className="mt-3 text-sm text-[#6b7280]">
            From passport applications to agricultural subsidies, get the exact requirements instantly.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {presets.map((p) => (
            <Link
              key={p.title}
              to="/app"
              className="group rounded-3xl border border-[#eae8e3] bg-white p-5 transition-all hover:border-[#0a0a0a] hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6b7280]">{p.authority}</span>
                  <span className="rounded-full bg-[#f4f3ef] px-2 py-0.5 text-[10px] font-semibold text-[#0a0a0a]">
                    {p.docs}
                  </span>
                </div>
                <h4 className="mt-2 text-base font-bold text-[#0a0a0a] group-hover:text-black">
                  {p.title}
                </h4>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#0a0a0a] pt-3 border-t border-[#f5f4ef]">
                <span>Verify checklist</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="mx-auto mt-28 max-w-3xl px-5">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            FAQ
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-[#0a0a0a]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-10 rounded-3xl border border-[#eae8e3] bg-white p-7 shadow-xs">
          <FaqItem
            question="Are my documents stored on your servers?"
            answer="No. DocuShield operates with a zero-retention architecture. Scans and PDF files are read into memory, analyzed in real time for authenticity, and flushed immediately after the verification verdict is issued."
          />
          <FaqItem
            question="What happens if a document is blurry or cropped?"
            answer="The AI inspection model detects low resolution, occluded borders, and glare. It flags the issue with clear instructions (e.g. 'Retake photo in natural lighting without flash') so you can upload a cleaner copy."
          />
          <FaqItem
            question="Can I scan an unlisted local municipal form?"
            answer="Yes! Click 'Scan a form' in the workspace. Our model will parse the form headers, extract the required enclosures, and build a custom checklist on the fly."
          />
          <FaqItem
            question="Which languages are supported for explanations?"
            answer="DocuShield supports English, Hindi, Marathi, Tamil, Bengali, and Gujarati for all guidance insights and fix recommendations."
          />
        </div>
      </section>

      {/* ── Bottom CTA Banner ── */}
      <section className="mx-auto mt-28 max-w-6xl px-5">
        <div className="rounded-3xl bg-[#0a0a0a] p-10 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              <Sparkles size={12} /> Ready in 30 seconds
            </span>
            <h2 className="mt-5 text-3xl font-extrabold sm:text-5xl text-white tracking-tight">
              Start verifying your application documents now
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-400">
              Never get your government application rejected for missing stamps, expired IDs, or format mistakes.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#0a0a0a] hover:bg-gray-100 transition-all shadow-lg"
              >
                Launch Verifier Workspace <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto mt-24 max-w-6xl border-t border-[#eae8e3] px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6b7280]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} strokeWidth={2.4} color="#0a0a0a" />
          <span className="font-bold text-[#0a0a0a]">DocuShield</span>
          <span>· Spiderverse Hackathon 2026</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-[#0a0a0a]">
            Home
          </Link>
          <Link to="/app" className="hover:text-[#0a0a0a]">
            Workspace
          </Link>
          <a href="#how-it-works" className="hover:text-[#0a0a0a]">
            How it works
          </a>
          <a href="#faq" className="hover:text-[#0a0a0a]">
            FAQ
          </a>
        </div>
        <div className="text-right">
          <span>In-memory AI · Privacy Guaranteed</span>
        </div>
      </footer>
    </div>
  );
}
