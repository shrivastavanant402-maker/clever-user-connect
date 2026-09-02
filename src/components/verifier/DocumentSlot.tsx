import { useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ACCEPTED } from "@/lib/local-file";
import { STAGE_LABEL, STAGE_PROGRESS, type SlotState } from "@/lib/upload-state";
import type { RequiredDoc } from "@/lib/requirements.functions";

export function DocumentSlot({
  doc,
  slot,
  onPick,
  onRemove,
  onDigilocker,
}: {
  doc: RequiredDoc;
  slot?: SlotState | undefined;
  onPick: (file: File) => void;
  onRemove: () => void;
  onDigilocker: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const status = slot?.verdict?.status;
  const busy = !!slot && slot.stage !== "done" && slot.stage !== "error";

  const StatusIcon =
    status === "verified"
      ? CheckCircle2
      : status === "warning"
        ? AlertTriangle
        : status === "rejected" || slot?.stage === "error"
          ? XCircle
          : null;

  const statusClass =
    status === "verified"
      ? "text-emerald-600"
      : status === "warning"
        ? "text-amber-600"
        : "text-red-600";

  return (
    <li className="rounded-2xl border border-[#eae8e3] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-[#dedbd3]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0a0a0a] text-[15px]">{doc.name}</span>
            <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-2 py-0.5 text-[10px] font-medium text-[#166534]">
              +Accuracy
            </span>
          </div>
          {doc.description && (
            <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">{doc.description}</p>
          )}
        </div>
        {StatusIcon && !busy && <StatusIcon className={`h-5 w-5 shrink-0 ${statusClass}`} />}
        {busy && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#0a0a0a]" />}
      </div>

      {!slot ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-[#f5f4ef]">
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] font-medium text-xs h-8 px-3.5 shadow-none"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1" /> Upload
          </Button>
          {doc.digilockerType && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-[#eae8e3] bg-[#faf9f7] text-[#0a0a0a] hover:bg-[#f4f3ef] font-medium text-xs h-8 px-3.5"
              onClick={onDigilocker}
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[#0a0a0a]" /> DigiLocker
            </Button>
          )}
          <span className="ml-auto text-[11px] font-medium text-[#9ca3af]">
            {doc.acceptedFormats.join(" · ")}
          </span>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5 pt-2 border-t border-[#f5f4ef]">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#faf9f7] border border-[#eae8e3] px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-[#6b7280]" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#0a0a0a]">
              {slot.file.name}
            </span>
            {slot.source === "digilocker" && (
              <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-medium text-[#1e40af]">
                DigiLocker
              </span>
            )}
            <button
              type="button"
              className="h-6 w-6 rounded-full flex items-center justify-center text-[#6b7280] hover:bg-[#ebe9e4] hover:text-[#0a0a0a] transition-colors"
              aria-label={`Remove ${slot.file.name}`}
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Progress value={STAGE_PROGRESS[slot.stage]} className="h-1.5 bg-[#eae8e3]" />
          <div className="flex items-center justify-between text-xs text-[#6b7280]">
            <span>{slot.stage === "error" ? (slot.error ?? "Failed") : STAGE_LABEL[slot.stage]}</span>
            {slot.verdict && (
              <span className="font-medium text-[#0a0a0a]">
                {slot.verdict.confidence}% confidence
              </span>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </li>
  );
}
