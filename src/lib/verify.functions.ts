import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DocVerdict = {
  status: "verified" | "warning" | "rejected";
  detectedType: string;
  matchesRequirement: boolean;
  extractedName: string | null;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  quality: "good" | "poor" | "unreadable";
  tamperingSuspected: boolean;
  confidence: number;
  issues: string[];
  insight: string;
  fixSteps: string[];
  extractedFields: Array<{ label: string; value: string }>;
};

const RESULT_SHAPE = `{
  "status": "verified" | "warning" | "rejected",
  "detectedType": string,
  "matchesRequirement": boolean,
  "extractedName": string | null,
  "documentNumber": string | null,
  "issueDate": string | null,
  "expiryDate": string | null,
  "quality": "good" | "poor" | "unreadable",
  "tamperingSuspected": boolean,
  "confidence": number (0-100),
  "issues": string[],
  "insight": string (why it passed or failed, in plain language, referencing what was actually read),
  "fixSteps": string[] (concrete actions the applicant should take; empty if verified),
  "extractedFields": [{ "label": string, "value": string }]
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

Do a genuine read of the attached document:
1. OCR every legible field and classify the document type.
2. Decide if it actually satisfies the checklist slot (wrong type => matchesRequirement false, status "rejected").
3. Check expiry against today, scan quality (blur, glare, cropped edges, low resolution), completeness of critical fields, name match with the applicant, and visual signs of tampering (mismatched fonts, misaligned text, edited numbers, digital artefacts). Never invent data you cannot read.
4. status: "verified" = accept as-is, "warning" = usable but flagged, "rejected" = must be replaced.
5. Write insight and fixSteps in ${data.language}, concise and specific.

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
    parsed.extractedFields ??= [];
    parsed.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0)));
    return parsed;
  });
