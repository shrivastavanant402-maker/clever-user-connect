// ─────────────────────────────────────────────────────────────────────────────
// org-store.ts
// Server-side in-memory store for Organisation Verification Module.
// Module-level state persists for the lifetime of the Nitro/Node process.
// ─────────────────────────────────────────────────────────────────────────────

// ── Hardcoded admin accounts (no real auth) ───────────────────────────────────
export const ADMIN_ACCOUNTS: { username: string; password: string; orgName: string }[] = [
  { username: "admin1", password: "DocuShield@2026", orgName: "Sunrise College" },
  { username: "admin2", password: "Verifier#Admin2", orgName: "Metro University" },
  { username: "admin3", password: "OrgCheck$2026",  orgName: "GovConnect Institute" },
];

// ── Data types ────────────────────────────────────────────────────────────────

export type ChecklistDocEntry = {
  id: string;
  name: string;           // e.g. "PAN Card"
  mandatory: boolean;
  expiryCheck: boolean;   // should expiry date be validated?
  crossMatch: boolean;    // participate in cross-document name matching?
  keywords: string;       // hints for AI classification (comma-separated)
  description: string;    // free-text notes for applicant
};

export type ChecklistTemplate = {
  id: string;
  name: string;           // e.g. "B.Tech Admission 2026"
  createdBy: string;      // admin username
  orgName: string;
  createdAt: string;      // ISO timestamp
  documents: ChecklistDocEntry[];
};

// ── In-memory store ───────────────────────────────────────────────────────────
const templates = new Map<string, ChecklistTemplate>();

// Seed a demo template so admins can see something on first login
const DEMO_ID = "demo-template-001";
templates.set(DEMO_ID, {
  id: DEMO_ID,
  name: "B.Tech Admission 2026",
  createdBy: "admin1",
  orgName: "Sunrise College",
  createdAt: new Date().toISOString(),
  documents: [
    {
      id: "doc-pan",
      name: "PAN Card",
      mandatory: true,
      expiryCheck: false,
      crossMatch: true,
      keywords: "Permanent Account Number, NSDL, Income Tax",
      description: "Copy of PAN card with clear photograph",
    },
    {
      id: "doc-10th",
      name: "10th Marksheet",
      mandatory: true,
      expiryCheck: false,
      crossMatch: true,
      keywords: "CBSE, ICSE, SSC, Board, Class X, Secondary",
      description: "Board-issued marksheet showing subject-wise marks",
    },
    {
      id: "doc-12th",
      name: "12th Marksheet",
      mandatory: true,
      expiryCheck: false,
      crossMatch: true,
      keywords: "CBSE, ISC, HSC, Class XII, Higher Secondary",
      description: "Board-issued marksheet with PCM/PCB marks",
    },
    {
      id: "doc-aadhaar",
      name: "Aadhaar Card",
      mandatory: true,
      expiryCheck: false,
      crossMatch: true,
      keywords: "UIDAI, Unique Identification, 12-digit",
      description: "Aadhaar card (front and back on same page preferred)",
    },
    {
      id: "doc-photo",
      name: "Passport-size Photograph",
      mandatory: true,
      expiryCheck: false,
      crossMatch: false,
      keywords: "photo, photograph, passport size, recent",
      description: "Recent colour photograph, white background, 35×45mm",
    },
    {
      id: "doc-tc",
      name: "Transfer Certificate (TC)",
      mandatory: false,
      expiryCheck: false,
      crossMatch: false,
      keywords: "Transfer Certificate, TC, School Leaving",
      description: "Original TC from last attended institution (optional if admitted provisionally)",
    },
  ],
});

// ── CRUD helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createTemplate(input: Omit<ChecklistTemplate, "id" | "createdAt">): ChecklistTemplate {
  const id = generateId();
  const template: ChecklistTemplate = { ...input, id, createdAt: new Date().toISOString() };
  templates.set(id, template);
  return template;
}

export function getTemplate(id: string): ChecklistTemplate | undefined {
  return templates.get(id);
}

export function updateTemplate(
  id: string,
  input: { name: string; documents: ChecklistDocEntry[]; orgName?: string | undefined },
): ChecklistTemplate | undefined {
  const existing = templates.get(id);
  if (!existing) return undefined;
  const updated: ChecklistTemplate = {
    ...existing,
    name: input.name,
    documents: input.documents,
    orgName: input.orgName ?? existing.orgName,
  };
  templates.set(id, updated);
  return updated;
}

export function duplicateTemplate(id: string, username?: string): ChecklistTemplate | undefined {
  const existing = templates.get(id);
  if (!existing) return undefined;
  const newId = generateId();
  const duplicated: ChecklistTemplate = {
    ...existing,
    id: newId,
    name: `${existing.name} (Copy)`,
    createdBy: username ?? existing.createdBy,
    createdAt: new Date().toISOString(),
    // Clone document entries with new IDs
    documents: existing.documents.map((d) => ({
      ...d,
      id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    })),
  };
  templates.set(newId, duplicated);
  return duplicated;
}

export function listTemplates(createdBy: string): ChecklistTemplate[] {
  return Array.from(templates.values()).filter((t) => t.createdBy === createdBy);
}

export function deleteTemplate(id: string): boolean {
  return templates.delete(id);
}
