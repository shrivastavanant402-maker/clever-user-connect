import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ExtractedField = {
  label: string;
  value: string;
  entryMode: "printed" | "handwritten" | "stamped" | "unknown";
  legible: boolean;
  status: "ok" | "missing" | "invalid" | "mismatch" | "illegible";
  note: string;
};

export type RequirementCheck = {
  requirement: string;
  met: boolean;
  evidence: string;
};

export type DocVerdict = {
  status: "verified" | "warning" | "rejected";
  detectedType: string;
  isGovernmentForm: boolean;
  formIdentifier: string | null;
  issuingAuthority: string | null;
  matchesRequirement: boolean;
  extractedName: string | null;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  quality: "good" | "poor" | "unreadable";
  tamperingSuspected: boolean;
  tamperingRisk: "none" | "low" | "medium" | "high";
  tamperingFindings: string[];
  handwrittenEntries: string[];
  incompleteFields: string[];
  signaturePresent: boolean;
  stampPresent: boolean;
  confidence: number;
  issues: string[];
  insight: string;
  fixSteps: string[];
  requirementChecks: RequirementCheck[];
  extractedFields: ExtractedField[];
};

const RESULT_SHAPE = `{
  "status": "verified" | "warning" | "rejected",
  "detectedType": string,
  "isGovernmentForm": boolean (true if this is a filled application/government form rather than an ID or certificate),
  "formIdentifier": string | null (form number / code printed on the form, e.g. "Form 49A"),
  "issuingAuthority": string | null,
  "matchesRequirement": boolean,
  "extractedName": string | null,
  "documentNumber": string | null,
  "issueDate": string | null,
  "expiryDate": string | null,
  "quality": "good" | "poor" | "unreadable",
  "tamperingSuspected": boolean,
  "tamperingRisk": "none" | "low" | "medium" | "high",
  "tamperingFindings": string[] (each concrete forensic observation with its location on the document, e.g. "date of birth digits use a different font weight than the rest of the line"),
  "handwrittenEntries": string[] (labels of fields filled in by hand),
  "incompleteFields": string[] (mandatory fields left blank or partially filled),
  "signaturePresent": boolean,
  "stampPresent": boolean,
  "confidence": number (0-100),
  "issues": string[],
  "insight": string (why it passed or failed, in plain language, referencing what was actually read),
  "fixSteps": string[] (concrete actions the applicant should take; empty if verified),
  "requirementChecks": [{ "requirement": string (one specific rule from the checklist slot), "met": boolean, "evidence": string (what was read that proves it) }],
  "extractedFields": [{
    "label": string,
    "value": string,
    "entryMode": "printed" | "handwritten" | "stamped" | "unknown",
    "legible": boolean,
    "status": "ok" | "missing" | "invalid" | "mismatch" | "illegible",
    "note": string (empty when status is ok)
  }]
}`;


export const verifyDocument = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        requirementName: z.string(),
        requirementDescription: z.string().default(""),
        applicantName: z.string().default(""),
        serviceName: z.string().default(""),
        language: z.string().default("English"),
        today: z.string().default(""),
        file: z.object({ name: z.string(), mimeType: z.string(), dataUrl: z.string() }),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<DocVerdict> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const isPdf = data.file.mimeType === "application/pdf";
    const media = isPdf
      ? { type: "file", file: { filename: data.file.name, file_data: data.file.dataUrl } }
      : { type: "image_url", image_url: { url: data.file.dataUrl } };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a strict document verification officer for the application: "${data.serviceName || "general application"}".

Checklist slot being filled: "${data.requirementName}"${
                  data.requirementDescription ? ` — ${data.requirementDescription}` : ""
                }
Applicant name on the application: ${data.applicantName || "(not provided)"}
Today's date: ${data.today || "unknown"}

Do a genuine, field-by-field read of the attached document:
1. OCR every legible field (label + value) and classify the document type. If it is a filled government/application form, read every printed label and the value entered against it, including annexures, declarations, signature and stamp blocks.
2. For each field set entryMode: "printed" (pre-printed or machine-filled), "handwritten" (filled in by hand — ink strokes, uneven baselines, cursive), "stamped", or "unknown". Flag every handwritten entry in handwrittenEntries, and mark any handwritten value that is hard to read as legible:false with status "illegible".
3. Validate each field against the scheme's exact requirements: correct format (e.g. 10-char PAN, 12-digit Aadhaar, DD/MM/YYYY dates, PIN codes, IFSC), internal consistency (dates in order, age vs date of birth), name match with the applicant, and mandatory fields left blank (list them in incompleteFields, status "missing").
4. Fill requirementChecks with one entry per specific rule implied by the checklist slot description, each with the evidence you actually read.
5. Decide if the document satisfies the checklist slot (wrong type => matchesRequirement false, status "rejected").
6. Check expiry against today, scan quality (blur, glare, cropped edges, low resolution), presence of signature and official stamp, and visual signs of tampering (mismatched fonts, misaligned text, overwritten or edited entries, digital artefacts). Never invent data you cannot read.
7. status: "verified" = accept as-is, "warning" = usable but flagged (e.g. handwritten but legible entries, minor quality issues), "rejected" = must be replaced (wrong document, missing mandatory fields, expired, illegible, suspected tampering).
8. Write insight, notes and fixSteps in ${data.language}, concise and specific.

Return ONLY minified JSON matching:
${RESULT_SHAPE}`,
              },
              media,
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Verification failed (${res.status}): ${await res.text()}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: DocVerdict;
    try {
      parsed = JSON.parse(cleaned) as DocVerdict;
    } catch {
      throw new Error("Could not read the AI response. Please try again.");
    }

    parsed.issues ??= [];
    parsed.fixSteps ??= [];
    parsed.handwrittenEntries ??= [];
    parsed.incompleteFields ??= [];
    parsed.requirementChecks ??= [];
    parsed.extractedFields = (parsed.extractedFields ?? []).map((f) => ({
      label: f.label,
      value: f.value ?? "",
      entryMode: f.entryMode ?? "unknown",
      legible: f.legible !== false,
      status: f.status ?? "ok",
      note: f.note ?? "",
    }));
    parsed.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0)));
    return parsed;
  });
