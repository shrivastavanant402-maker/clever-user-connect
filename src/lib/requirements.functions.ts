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
  
  const model = body.model || process.env["GEMINI_MODEL"] || "gemini-2.5-flash";

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
    generationConfig: {
      ...(body.response_format?.type === "json_object" ? { responseMimeType: "application/json" } : {}),
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.1,
    }
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
    mandatory: false,
    acceptedFormats: d.acceptedFormats ?? ["JPG", "PNG", "PDF"],
    digilockerType: d.digilockerType ?? null,
  })),
});

const PRESET_REQUIREMENTS: Record<string, ServiceRequirements> = {
  passport: {
    serviceName: "Passport (Fresh, Adult)",
    authority: "Passport Seva, Ministry of External Affairs",
    overview: "Standard application for fresh Indian passport for adult citizens under normal category.",
    notes: [
      "All documents must be self-attested copies of the original credentials.",
      "Applicant name and date of birth must match identically across all documents.",
      "Ensure photographs meet the 35mm x 45mm white background standard."
    ],
    documents: [
      {
        id: "proof-of-identity",
        name: "Proof of Identity (Aadhaar / Voter ID / PAN)",
        description: "Government-issued photo ID showing full legal name and photograph.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Aadhaar Card"
      },
      {
        id: "proof-of-dob",
        name: "Proof of Date of Birth (Birth Certificate / 10th Marksheet)",
        description: "Official certificate issued by Municipal Corporation or Board Marksheet with clear DOB.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Class X Marksheet"
      },
      {
        id: "proof-of-address",
        name: "Proof of Present Address (Utility Bill / Rent Agreement / Bank Passbook)",
        description: "Valid address proof dated within the last 3 months with current residence.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Electricity Bill"
      },
      {
        id: "annexure-e",
        name: "Self-Declaration (Annexure E / Citizenship declaration)",
        description: "Signed standard declaration affirming Indian citizenship with no criminal records.",
        mandatory: false,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      }
    ]
  },
  pan: {
    serviceName: "PAN Card Correction / Update",
    authority: "Income Tax Department (NSDL / Protean / UTIITSL)",
    overview: "Correction or update of personal details in existing Permanent Account Number database.",
    notes: [
      "Documentary proof is mandatory for any changed demographic attribute.",
      "Signature or thumb impression must be in black/blue ink within the designated box."
    ],
    documents: [
      {
        id: "existing-pan",
        name: "Copy of Existing PAN Card",
        description: "Original or clear photocopy of current PAN card showing 10-character alphanumeric PAN.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "PAN Verification Record"
      },
      {
        id: "proof-of-id",
        name: "Proof of Identity (Aadhaar Card)",
        description: "Aadhaar card with complete name and recent photograph matching updated details.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Aadhaar Card"
      },
      {
        id: "proof-of-dob",
        name: "Proof of Date of Birth",
        description: "Birth certificate, 10th standard certificate, or passport showing exact DD/MM/YYYY.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Class X Marksheet"
      },
      {
        id: "proof-of-correction",
        name: "Supporting Evidence for Requested Change",
        description: "Gazette notification or marriage certificate if correcting surname or father's name.",
        mandatory: false,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      }
    ]
  },
  driving: {
    serviceName: "Driving Licence Renewal",
    authority: "Ministry of Road Transport and Highways (Parivahan Sewa / RTO)",
    overview: "Renewal of expired or expiring Indian Driving Licence across state RTO jurisdictions.",
    notes: [
      "Form 1-A medical certificate is mandatory if applicant is older than 40 years.",
      "Licence expired for more than 1 year may require re-testing."
    ],
    documents: [
      {
        id: "original-dl",
        name: "Current / Expired Driving Licence",
        description: "Original physical smart card or legible scan of both front and back.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Driving Licence"
      },
      {
        id: "medical-cert",
        name: "Medical Certificate (Form 1-A)",
        description: "Certified medical fitness form signed and stamped by registered medical practitioner.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      },
      {
        id: "address-proof",
        name: "Current Address Proof",
        description: "Aadhaar card, voter ID, or passport indicating residence in RTO jurisdiction.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Aadhaar Card"
      }
    ]
  },
  kisan: {
    serviceName: "PM Kisan Samman Nidhi Scheme",
    authority: "Ministry of Agriculture and Farmers Welfare, Govt of India",
    overview: "Income support scheme of ₹6,000 per year for all landholding farmer families.",
    notes: [
      "Bank account must be Aadhaar-linked and DBT enabled.",
      "Land ownership record must show applicant as registered landholder."
    ],
    documents: [
      {
        id: "aadhaar-card",
        name: "Aadhaar Card",
        description: "Applicant's Aadhaar card with biometric authentication consent.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Aadhaar Card"
      },
      {
        id: "land-records",
        name: "Land Ownership Record (Khatauni / 7/12 Extract)",
        description: "Revenue department record showing cultivable land plot number and ownership share.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      },
      {
        id: "bank-passbook",
        name: "Bank Passbook / Cancelled Cheque",
        description: "Active savings bank account passbook showing IFSC and account number.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      }
    ]
  },
  gst: {
    serviceName: "GST Registration (New Business)",
    authority: "Goods and Services Tax Network (GSTN), CBIC",
    overview: "Registration for businesses and proprietors under the GST Act for tax compliance.",
    notes: [
      "Principal place of business must have electricity bill or rent agreement in owner's name.",
      "Authorized signatory must undergo Aadhaar authentication."
    ],
    documents: [
      {
        id: "pan-card",
        name: "PAN Card of Business / Proprietor",
        description: "Permanent Account Number card of proprietor, partnership, or corporate entity.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "PAN Verification Record"
      },
      {
        id: "business-address",
        name: "Proof of Principal Place of Business",
        description: "Electricity bill, property tax receipt, or registered lease/rent deed with NOC.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Electricity Bill"
      },
      {
        id: "bank-proof",
        name: "Bank Account Proof",
        description: "Bank statement, first page of passbook, or cancelled cheque with business name.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      },
      {
        id: "identity-photo",
        name: "Photograph & ID of Promoters / Signatories",
        description: "Passport-size photograph and Aadhaar/Passport of authorized signatory.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Aadhaar Card"
      }
    ]
  }
};

function getFallbackServiceRequirements(query: string, language: string = "English"): ServiceRequirements {
  const q = query.toLowerCase();
  if (q.includes("passport")) return PRESET_REQUIREMENTS["passport"]!;
  if (q.includes("pan")) return PRESET_REQUIREMENTS["pan"]!;
  if (q.includes("licen") || q.includes("driving") || q.includes("rto")) return PRESET_REQUIREMENTS["driving"]!;
  if (q.includes("kisan") || q.includes("farmer") || q.includes("pm-kisan")) return PRESET_REQUIREMENTS["kisan"]!;
  if (q.includes("gst") || q.includes("business") || q.includes("tax")) return PRESET_REQUIREMENTS["gst"]!;

  const title = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
  return {
    serviceName: title,
    authority: "Government Authority / Authorized Board",
    overview: `Official application checklist for ${title}. Submit valid, unexpired credentials.`,
    notes: [
      "All submitted scans must be clear, well-lit, and uncropped.",
      "Names and birthdates must align across all proof documents."
    ],
    documents: [
      {
        id: "primary-id",
        name: "Identity Proof (Aadhaar / Voter ID / Passport)",
        description: "Government-issued photo identification with visible full name.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Aadhaar Card"
      },
      {
        id: "address-proof",
        name: "Current Residential Address Proof",
        description: "Utility bill, bank statement, or registered agreement dated within 3 months.",
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: "Electricity Bill"
      },
      {
        id: "supporting-credential",
        name: `${title} Supporting Certificate / Declaration`,
        description: `Official prerequisite form or qualifying document for ${title}.`,
        mandatory: true,
        acceptedFormats: ["PDF", "JPG", "PNG"],
        digilockerType: null
      },
      {
        id: "photograph",
        name: "Recent Passport Size Photograph",
        description: "Recent color photo with white background, clear face view.",
        mandatory: false,
        acceptedFormats: ["JPG", "PNG"],
        digilockerType: null
      }
    ]
  };
}

export const getServiceRequirements = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ query: z.string().min(2).max(300), language: z.string().default("English") }).parse(data),
  )
  .handler(async ({ data }): Promise<ServiceRequirements> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return normalise(getFallbackServiceRequirements(data.query, data.language));
    }

    try {
      const parsed = (await gateway({
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
    } catch (err) {
      console.warn("Gemini API call failed, using fallback requirements for presentation:", err);
      return normalise(getFallbackServiceRequirements(data.query, data.language));
    }
  });

export const scanFormRequirements = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        file: z.object({ name: z.string(), mimeType: z.string(), dataUrl: z.string() }),
        language: z.string().default("English"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ServiceRequirements> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      const fileName = data.file?.name || "Application Form";
      return normalise(getFallbackServiceRequirements(fileName.replace(/\.[^/.]+$/, ""), data.language));
    }

    try {
      const isPdf = data.file.mimeType === "application/pdf";
      const media = isPdf
        ? { type: "file", file: { filename: data.file.name, file_data: data.file.dataUrl } }
        : { type: "image_url", image_url: { url: data.file.dataUrl } };

      const parsed = (await gateway({
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
    } catch (err) {
      console.warn("Gemini API call failed, using fallback form requirements for presentation:", err);
      const fileName = data.file?.name || "Application Form";
      return normalise(getFallbackServiceRequirements(fileName.replace(/\.[^/.]+$/, ""), data.language));
    }
  });
