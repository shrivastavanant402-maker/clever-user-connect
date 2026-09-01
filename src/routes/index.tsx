import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Check, AlertTriangle, X, ChevronRight } from "lucide-react";

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
      {/* Phone bezel */}
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
            <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
          </div>
          <div className="landing-phone__header-title">
            <div className="landing-phone__header-avatar">
              <ShieldCheck size={12} color="#fff" />
            </div>
            <span>DocuShield Verify</span>
          </div>
          <div className="landing-phone__header-dots">•••</div>
        </div>

        {/* Scrollable card area */}
        <div className="landing-phone__body">
          {/* Verified card */}
          <div className="landing-phone__card landing-phone__card--verified">
            <div className="landing-phone__card-top">
              <div className="landing-phone__card-icon landing-phone__card-icon--green">
                <Check size={14} color="#fff" />
              </div>
              <div className="landing-phone__card-info">
                <span className="landing-phone__card-name">Passport</span>
                <span className="landing-phone__card-sub">Verified · 2 sec ago</span>
              </div>
              <span className="landing-phone__card-badge landing-phone__card-badge--green">Verified</span>
            </div>
            <div className="landing-phone__card-details">
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Name match</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ Pass</span>
              </div>
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Expiry</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ Valid until 2034</span>
              </div>
              <div className="landing-phone__card-row">
                <span className="landing-phone__card-label">Tampering</span>
                <span className="landing-phone__card-value landing-phone__card-value--pass">✓ None detected</span>
              </div>
            </div>
          </div>

          {/* Warning card */}
          <div className="landing-phone__card landing-phone__card--warning">
            <div className="landing-phone__card-top">
              <div className="landing-phone__card-icon landing-phone__card-icon--amber">
                <AlertTriangle size={14} color="#fff" />
              </div>
              <div className="landing-phone__card-info">
                <span className="landing-phone__card-name">Aadhaar Card</span>
                <span className="landing-phone__card-sub">Flagged · needs review</span>
              </div>
              <span className="landing-phone__card-badge landing-phone__card-badge--amber">Warning</span>
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
          <div className="landing-phone__card landing-phone__card--rejected">
            <div className="landing-phone__card-top">
              <div className="landing-phone__card-icon landing-phone__card-icon--red">
                <X size={14} color="#fff" />
              </div>
              <div className="landing-phone__card-info">
                <span className="landing-phone__card-name">PAN Card</span>
                <span className="landing-phone__card-sub">Rejected · expired</span>
              </div>
              <span className="landing-phone__card-badge landing-phone__card-badge--red">Rejected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Landing Page ── */
function LandingPage() {
  return (
    <div className="landing">
      {/* ── Floating pill navbar ── */}
      <nav className="landing-nav" id="landing-nav">
        <div className="landing-nav__inner">
          {/* Logo + badge */}
          <div className="landing-nav__logo">
            <ShieldCheck size={22} strokeWidth={2.2} color="#0a0a0a" />
            <span className="landing-nav__wordmark">DocuShield</span>
            <span className="landing-nav__badge">BETA</span>
          </div>

          {/* Center links */}
          <div className="landing-nav__links">
            <Link to="/" className="landing-nav__link">Features</Link>
            <Link to="/" className="landing-nav__link">How it works</Link>
            <Link to="/" className="landing-nav__link">Pricing</Link>
            <Link to="/" className="landing-nav__link">Docs</Link>
          </div>

          {/* CTA */}
          <Link to="/app" className="landing-nav__cta" id="get-started-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="landing-hero" id="hero-section">
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
            Start verifying — it's free
            <ChevronRight size={16} />
          </Link>
          <span className="landing-hero__btn-secondary">
            No sign-up required
          </span>
        </div>

        {/* Phone mockup — bleeds off bottom */}
        <div className="landing-hero__mockup-container">
          <PhoneMockup />
        </div>
      </section>
    </div>
  );
}
