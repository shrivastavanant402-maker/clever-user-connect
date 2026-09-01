import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type RequiredDoc = {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
  acceptedFormats: string[];
  digilockerType: string | null;
};

export type ServiceRequirements = {
  serviceName: string;
  authority: string;
  overview: string;
  documents: RequiredDoc[];
  notes: string[];
};

const SHAPE = `{
  "serviceName": string,
  "authority": string,
  "overview": string,
  "documents": [{
    "id": string (kebab-case),
    "name": string,
    "description": string (what exactly must be visible on it),
    "mandatory": boolean,
    "acceptedFormats": string[],
    "digilockerType": string | null (the DigiLocker issued-document name if it is normally available there, else null)
  }],
  "notes": string[]
}`;

const gateway = async (body: any) => {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");
  
  const geminiBody = {
    contents: body.messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: Array.isArray(m.content)
        ? m.content.map((c: any) => {
            if (c.type === "text") return { text: c.text };
            if (c.type === "image_url") {
              const b64Parts = c.image_url.url.split(",");
              const mime = b64Parts[0].split(":")[1].split(";")[0];
              return { inlineData: { mimeType: mime, data: b64Parts[1] } };
            }
            if (c.type === "file") {
              const b64Parts = c.file.file_data.split(",");
              const mime = b64Parts[0].split(":")[1].split(";")[0];
              return { inlineData: { mimeType: mime, data: b64Parts[1] } };
            }
            return { text: "" };
          })
        : [{ text: m.content }]
    })),
    generationConfig: body.response_format?.type === "json_object" ? { responseMimeType: "application/json" } : undefined
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiBody),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please retry in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${await res.text()}`);
  const json = await res.json() as any;
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    throw new Error("Could not read the AI response. Please try again.");
  }
};

const normalise = (r: ServiceRequirements): ServiceRequirements => ({
  serviceName: r.serviceName || "Application",
  authority: r.authority || "—",
  overview: r.overview || "",
  notes: r.notes ?? [],
  documents: (r.documents ?? []).map((d, i) => ({
    id: d.id || `doc-${i}`,
    name: d.name,
    description: d.description ?? "",
    mandatory: d.mandatory !== false,
    acceptedFormats: d.acceptedFormats ?? ["JPG", "PNG", "PDF"],
    digilockerType: d.digilockerType ?? null,
  })),
});

export const getServiceRequirements = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().min(2).max(300), language: z.string().default("English") }).parse(data),
  )
  .handler(async ({ data }): Promise<ServiceRequirements> => {
    const parsed = (await gateway({
      model: "gemini-3.6-flash",
      messages: [
        {
          role: "user",
          content: `A user wants to apply for: "${data.query}".

Identify the government service, scheme, licence or private-sector application they mean (assume India unless the query says otherwise) and list every document required to apply, in ${data.language}.
Be accurate and specific about what each document must show. Mark optional/conditional documents as mandatory:false.

Return ONLY minified JSON matching:
${SHAPE}`,
        },
      ],
      response_format: { type: "json_object" },
    })) as ServiceRequirements;
    return normalise(parsed);
  });

export const scanFormRequirements = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        file: z.object({ name: z.string(), mimeType: z.string(), dataUrl: z.string() }),
        language: z.string().default("English"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ServiceRequirements> => {
    const isPdf = data.file.mimeType === "application/pdf";
    const media = isPdf
      ? { type: "file", file: { filename: data.file.name, file_data: data.file.dataUrl } }
      : { type: "image_url", image_url: { url: data.file.dataUrl } };

    const parsed = (await gateway({
      model: "gemini-3.6-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Read this application form. Identify which service/scheme it is for and the issuing authority, then list every supporting document an applicant must attach with it, in ${data.language}. Include documents implied by the form's declarations and annexures.

Return ONLY minified JSON matching:
${SHAPE}`,
            },
            media,
          ],
        },
      ],
      response_format: { type: "json_object" },
    })) as ServiceRequirements;
    return normalise(parsed);
  });
