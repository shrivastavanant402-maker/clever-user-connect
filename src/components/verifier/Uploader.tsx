import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LocalFile = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

const readFile = (file: File) =>
  new Promise<LocalFile>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result),
      });
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export function Uploader({
  files,
  onChange,
}: {
  files: LocalFile[];
  onChange: (files: LocalFile[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = useCallback(
    async (list: FileList | null) => {
      if (!list) return;
      const accepted = Array.from(list).filter((f) => f.type.startsWith("image/"));
      const read = await Promise.all(accepted.map(readFile));
      onChange([...files, ...read].slice(0, 8));
    },
    [files, onChange],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
        }`}
      >
        <UploadCloud className="mx-auto h-9 w-9 text-primary" />
        <p className="mt-3 font-medium">Drop document images here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          PAN, Aadhaar, address proof, photograph — JPG or PNG, up to 8 files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3"
            >
              <img
                src={f.dataUrl}
                alt={f.name}
                className="h-12 w-12 rounded-lg object-cover"
                loading="lazy"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                <FileImage className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                {f.name}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
