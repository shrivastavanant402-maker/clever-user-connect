import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const fileSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  dataUrl: z.string(),
});

const inputSchema = z.object({
  applicantName: z.string().default(""),
  requiredDocs: z.array(z.string()).min(1),
  files: z.array(fileSchema).min(1).max(8),
  language: z.string().default("English"),
});

export type DocFinding = {
  fileName: string;
  detectedType: string;
  matchedRequirement: string | null;
  status: "verified" | "warning" | "rejected";
  issues: string[];
  extractedName: string | null;
  documentNumber: string | null;
  expiryDate: string | null;
  quality: "good" | "poor" | "unreadable";
  confidence: number;
  explanation: string;
};

export type VerificationResult = {
  findings: DocFinding[];
  missing: string[];
  duplicates: string[];
  readiness: number;
  summary: string;
  nextActions: string[];
};

const RESULT_SHAPE = `{
  "findings": [{
    "fileName": string,
    "detectedType": string,
    "matchedRequirement": string | null,
    "status": "verified" | "warning" | "rejected",
    "issues": string[],
    "extractedName": string | null,
    "documentNumber": string | null,
    "expiryDate": string | null,
    "quality": "good" | "poor" | "unreadable",
    "confidence": number,
    "explanation": string
  }],
  "missing": string[],
  "duplicates": string[],
  "readiness": number,
  "summary": string,
  "nextActions": string[]
}`;

export const verifyDocuments = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<VerificationResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `You are a document verification engine for business-service applications.

Applicant name on the application: ${data.applicantName || "(not provided)"}
Required documents checklist: ${data.requiredDocs.join(", ")}

For EVERY uploaded image below (they are given in the same order as this list: ${data.files
          .map((f) => f.name)
          .join(", ")}):
1. Read the document (OCR) and classify its type.
2. Match it to one checklist item, or null if it matches none (then status must be "rejected" with issue "Incorrect document type").
3. Detect: expiry in the past (expired), poor/blurred/cropped scans, name mismatch vs the applicant name, missing critical fields.
4. Flag near-identical documents uploaded twice in "duplicates".
5. status: "verified" = usable, "warning" = usable but has an issue (name mismatch, low quality, expiring soon), "rejected" = unusable/wrong/expired.
6. confidence is 0-100. readiness is 0-100 = share of checklist items satisfied by verified docs, minus penalties for warnings.
7. Write explanation and summary in ${data.language}. Be concise and specific, referencing what you actually read.

Return ONLY minified JSON matching:
${RESULT_SHAPE}`,
      },
    ];

    for (const f of data.files) {
      content.push({ type: "image_url", image_url: { url: f.dataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Verification failed (${res.status}): ${await res.text()}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: VerificationResult;
    try {
      parsed = JSON.parse(cleaned) as VerificationResult;
    } catch {
      throw new Error("Could not read the AI response. Please try again.");
    }

    parsed.findings ??= [];
    parsed.missing ??= [];
    parsed.duplicates ??= [];
    parsed.nextActions ??= [];
    parsed.readiness = Math.max(0, Math.min(100, Math.round(parsed.readiness ?? 0)));
    return parsed;
  });
