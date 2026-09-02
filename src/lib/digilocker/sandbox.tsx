import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { toast } from "sonner";

export interface DigiLockerSandboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
}

const DEMO_DOCUMENTS = [
  { id: "aadhaar", name: "Aadhaar Card", issuer: "Unique Identification Authority of India (UIDAI)" },
  { id: "pan", name: "PAN Verification Record", issuer: "Income Tax Department, Govt of India" },
  { id: "driving", name: "Driving Licence", issuer: "Regional Transport Office (RTO)" },
  { id: "10th", name: "Class X Marksheet", issuer: "Central Board of Secondary Education (CBSE)" },
  { id: "12th", name: "Class XII Marksheet", issuer: "Central Board of Secondary Education (CBSE)" },
  { id: "income", name: "Income Certificate", issuer: "Revenue Department" },
  { id: "electricity", name: "Electricity Bill", issuer: "State Electricity Distribution Corporation" },
];

export function DigiLockerSandboxModal({ open, onOpenChange, onImport }: DigiLockerSandboxModalProps) {
  const [step, setStep] = useState<"intro" | "list" | "consent" | "importing">("intro");
  const [selectedDoc, setSelectedDoc] = useState<typeof DEMO_DOCUMENTS[0] | null>(null);

  useEffect(() => {
    if (open) {
      setStep("intro");
      setSelectedDoc(null);
    }
  }, [open]);

  const handleGenerateAndImport = async () => {
    setStep("importing");
    
    // Simulate network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      const file = await generateDemoDocument(selectedDoc?.name || "Demo Document", selectedDoc?.issuer || "Demo Issuer");
      toast.success("Document imported from DigiLocker Sandbox");
      onImport(file);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate demo document");
      setStep("consent");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (step !== "importing") onOpenChange(val);
    }}>
      <DialogContent className="rounded-3xl border border-[#eae8e3] bg-white p-0 overflow-hidden max-w-[440px]">
        
        {/* Header Section */}
        <div className="bg-[#faf9f7] px-6 py-5 border-b border-[#eae8e3]">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg font-bold text-[#0a0a0a]">
              <ShieldCheck className="h-5 w-5 text-emerald-700" /> DigiLocker Sandbox
            </span>
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
              Demo Mode
            </span>
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-relaxed text-[#6b7280]">
            {step === "intro" && "Connect to a simulated digital document locker to import a realistic sample document."}
            {step === "list" && "Select a demo document to import into DocuShield."}
            {step === "consent" && "Simulated OAuth consent step."}
            {step === "importing" && "Generating demo document..."}
          </DialogDescription>
        </div>

        {/* Content Section */}
        <div className="px-6 py-5 min-h-[250px]">
          {step === "intro" && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 h-full pt-4">
              <div className="rounded-full bg-emerald-50 p-4">
                <ShieldCheck className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a0a0a]">Simulated API Setu Integration</p>
                <p className="mt-2 text-xs text-[#6b7280]">
                  This is a Sandbox flow. No real official DigiLocker APIs are called, and no real personal data is used.
                </p>
              </div>
            </div>
          )}

          {step === "list" && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {DEMO_DOCUMENTS.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left flex items-center p-3 rounded-xl border transition-all ${
                    selectedDoc?.id === doc.id
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-[#eae8e3] hover:border-emerald-300 hover:bg-[#faf9f7]"
                  }`}
                >
                  <div className="rounded-full bg-white p-2 border border-[#eae8e3] mr-3 shadow-sm">
                    <FileText className="h-4 w-4 text-[#6b7280]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0a0a0a] truncate">{doc.name}</p>
                    <p className="text-[10px] text-[#6b7280] truncate mt-0.5">{doc.issuer}</p>
                  </div>
                  {selectedDoc?.id === doc.id ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] bg-[#eae8e3] px-2 py-0.5 rounded-full text-[#6b7280] font-medium shrink-0">
                      Sandbox Data
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === "consent" && selectedDoc && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-[#0a0a0a] text-center mb-1">
                  Allow DocuShield to access this document?
                </p>
                <p className="text-xs text-amber-700 text-center">
                  (DigiLocker Sandbox — simulated consent)
                </p>
              </div>

              <div className="rounded-xl border border-[#eae8e3] p-4 bg-[#faf9f7] space-y-3 text-xs">
                <div>
                  <span className="text-[#6b7280]">Document:</span>
                  <p className="font-semibold text-[#0a0a0a]">{selectedDoc.name}</p>
                </div>
                <div>
                  <span className="text-[#6b7280]">Requested access:</span>
                  <ul className="mt-1 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Document file</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Document metadata</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-[#0a0a0a]">Importing Document...</p>
              <p className="text-xs text-[#6b7280]">Generating realistic demo file</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== "importing" && (
          <div className="bg-[#faf9f7] px-6 py-4 border-t border-[#eae8e3] flex justify-between">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#6b7280] hover:text-[#0a0a0a] hover:bg-[#eae8e3] rounded-full px-4 h-9 text-xs"
            >
              Cancel
            </Button>

            {step === "intro" && (
              <Button
                className="bg-[#0a0a0a] text-white hover:bg-[#262626] rounded-full px-5 h-9 text-xs"
                onClick={() => setStep("list")}
              >
                Continue <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}

            {step === "list" && (
              <Button
                className="bg-[#0a0a0a] text-white hover:bg-[#262626] rounded-full px-5 h-9 text-xs"
                disabled={!selectedDoc}
                onClick={() => setStep("consent")}
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}

            {step === "consent" && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-full px-5 h-9 text-xs"
                onClick={handleGenerateAndImport}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Allow Access
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generates a realistic-looking placeholder PNG document using HTML Canvas.
 * This ensures the generated file is a standard File blob that passes flawlessly
 * through the existing Gemini AI and SHA-256 fingerprinting pipeline.
 */
function generateDemoDocument(docName: string, issuer: string): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 700;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Canvas 2D context not supported");

      // Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a subtle watermark pattern
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "italic 30px sans-serif";
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          ctx.fillText("DIGILOCKER VERIFIED", i * 250 - 50, j * 200 + 50);
        }
      }

      // Draw a solid border
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Header section
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(issuer.toUpperCase(), canvas.width / 2, 90);

      ctx.fillStyle = "#374151";
      ctx.font = "16px sans-serif";
      ctx.fillText("Digitally Signed Document (Sandbox Demo)", canvas.width / 2, 120);

      // Separator line
      ctx.beginPath();
      ctx.moveTo(80, 150);
      ctx.lineTo(canvas.width - 80, 150);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Document Title
      ctx.fillStyle = "#111827";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(docName.toUpperCase(), canvas.width / 2, 210);

      // Document fields (Left aligned)
      ctx.textAlign = "left";
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#4b5563";
      
      const startX = 120;
      let startY = 300;
      const lineHeight = 45;

      const demoFields = [
        { label: "Holder Name:", value: "Applicant" },
        { label: "Document ID:", value: `DEMO-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` },
        { label: "Issue Date:", value: "2024-05-12" },
        { label: "Valid Until:", value: "2034-05-11" },
        { label: "Status:", value: "Active / Verified" }
      ];

      demoFields.forEach(field => {
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(field.label, startX, startY);
        
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#111827";
        ctx.fillText(field.value, startX + 160, startY);
        
        ctx.fillStyle = "#4b5563";
        startY += lineHeight;
      });

      // Digital Signature Badge (Bottom Right)
      const sigX = canvas.width - 320;
      const sigY = canvas.height - 180;
      
      ctx.fillStyle = "#ecfdf5";
      ctx.fillRect(sigX, sigY, 260, 100);
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.strokeRect(sigX, sigY, 260, 100);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Digitally Signed by:", sigX + 20, sigY + 30);
      
      ctx.fillStyle = "#064e3b";
      ctx.font = "italic 20px serif";
      ctx.fillText("Authorized Signatory", sigX + 20, sigY + 60);
      
      ctx.fillStyle = "#34d399";
      ctx.font = "12px monospace";
      ctx.fillText(`Timestamp: ${new Date().toISOString()}`, sigX + 20, sigY + 85);

      // Convert to blob and file
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob"));
          return;
        }
        
        const fileName = `${docName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-demo.png`;
        const file = new File([blob], fileName, { type: "image/png" });
        resolve(file);
      }, "image/png");

    } catch (err) {
      reject(err);
    }
  });
}
