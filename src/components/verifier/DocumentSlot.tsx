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
      ? "text-success"
      : status === "warning"
        ? "text-warning"
        : "text-destructive";

  return (
    <li className="rounded-xl border border-border bg-secondary/25 p-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium">
            {doc.name}
            {!doc.mandatory && (
              <Badge variant="secondary" className="text-[10px]">
                Optional
              </Badge>
            )}
          </p>
          {doc.description && (
            <p className="mt-1 text-xs text-muted-foreground">{doc.description}</p>
          )}
        </div>
        {StatusIcon && !busy && <StatusIcon className={`h-5 w-5 shrink-0 ${statusClass}`} />}
        {busy && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />}
      </div>

      {!slot ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" /> Upload
          </Button>
          {doc.digilockerType && (
            <Button type="button" size="sm" variant="outline" onClick={onDigilocker}>
              <ShieldCheck className="h-4 w-4" /> Fetch from DigiLocker
            </Button>
          )}
          <span className="self-center text-[11px] text-muted-foreground">
            {doc.acceptedFormats.join(" · ")}
          </span>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-xs">{slot.file.name}</span>
            {slot.source === "digilocker" && (
              <Badge variant="secondary" className="text-[10px]">
                DigiLocker
              </Badge>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label={`Remove ${slot.file.name}`}
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Progress value={STAGE_PROGRESS[slot.stage]} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {slot.stage === "error" ? (slot.error ?? "Failed") : STAGE_LABEL[slot.stage]}
            {slot.verdict && ` · ${slot.verdict.confidence}% confidence`}
          </p>
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
