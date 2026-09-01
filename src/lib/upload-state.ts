import type { LocalFile } from "@/lib/local-file";
import type { DocVerdict } from "@/lib/verify.functions";

export type Stage = "idle" | "reading" | "ocr" | "classify" | "validate" | "done" | "error";

export const STAGE_LABEL: Record<Stage, string> = {
  idle: "Waiting for upload",
  reading: "Reading file",
  ocr: "OCR — extracting text",
  classify: "Classifying document type",
  validate: "Validating against checklist",
  done: "Complete",
  error: "Failed",
};

export const STAGE_PROGRESS: Record<Stage, number> = {
  idle: 0,
  reading: 15,
  ocr: 45,
  classify: 70,
  validate: 90,
  done: 100,
  error: 100,
};

export type SlotState = {
  file: LocalFile;
  stage: Stage;
  source: "upload" | "digilocker";
  verdict?: DocVerdict;
  error?: string;
};

export type FeedEvent = {
  id: string;
  time: string;
  docName: string;
  message: string;
  tone: "info" | "success" | "warning" | "error";
};
