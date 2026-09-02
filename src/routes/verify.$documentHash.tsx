import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import { DOCUSHIELD_REGISTRY_ADDRESS, DOCUSHIELD_REGISTRY_ABI } from "@/lib/contracts";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/verify/$documentHash")({
  component: VerifyPublicRoute,
});

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-[#f4f3ef] text-[#6b7280] transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function VerifyPublicRoute() {
  const { documentHash } = Route.useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isHashValid = 
    typeof documentHash === "string" && 
    (documentHash.length === 64 || (documentHash.length === 66 && documentHash.startsWith("0x"))) &&
    /^[0-9a-fA-F]+$/.test(documentHash.replace("0x", ""));

  const normalizedHash = isHashValid 
    ? (documentHash.startsWith("0x") ? documentHash : `0x${documentHash}`)
    : "";

  useEffect(() => {
    let mounted = true;

    async function fetchRecord() {
      if (!isHashValid) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const provider = new JsonRpcProvider(import.meta.env['VITE_AMOY_RPC_URL'] || "https://rpc-amoy.polygon.technology/");
        const contract = new Contract(DOCUSHIELD_REGISTRY_ADDRESS, DOCUSHIELD_REGISTRY_ABI, provider) as any;

        // 1. Fetch exact current state from mapping
        const docState = await contract.documents(normalizedHash);
        
        if (mounted) {
          setRecord({
            documentHash: docState[0],
            issuer: docState[1],
            registeredAt: Number(docState[2]) * 1000,
            version: Number(docState[3]),
            active: docState[4],
            exists: docState[5]
          });
        }

        // 2. Fetch the transaction hash from the event logs if it exists
        if (docState[5]) { // only query logs if it actually exists
          const filter = contract.filters.DocumentRegistered(normalizedHash, null, null);
          // Look back an arbitrary large amount for Amoy, or just "earliest" if the RPC allows it.
          // Since we query by indexed parameter `documentId` (which is `normalizedHash`), it's highly optimized.
          const logs = await contract.queryFilter(filter, "earliest", "latest").catch(() => {
            // fallback if the public RPC rejects "earliest" due to block range limit
            return provider.getBlockNumber().then(current => 
              contract.queryFilter(filter, Math.max(0, current - 200000), "latest")
            );
          });
          
          if (logs.length > 0 && mounted) {
            setTxHash(logs[0].transactionHash);
          }
        }
        
      } catch (err: any) {
        console.error("Public Verification Error:", err);
        if (mounted) {
          setError(err.message || "Failed to communicate with the Polygon Amoy blockchain.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRecord();

    return () => {
      mounted = false;
    };
  }, [normalizedHash, isHashValid]);

  // -- STATES --

  if (!isHashValid) {
    return (
      <VerificationLayout>
        <div className="text-center py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Invalid Document Identifier</h2>
          <p className="mt-3 text-sm text-[#6b7280] max-w-md mx-auto">
            The provided document hash is improperly formatted. Please ensure you scanned the correct DocuShield QR code.
          </p>
        </div>
      </VerificationLayout>
    );
  }

  if (loading) {
    return (
      <VerificationLayout>
        <div className="text-center py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f3ef] mb-6 animate-pulse">
            <Activity className="h-8 w-8 text-[#6b7280]" />
          </div>
          <h2 className="text-xl font-bold text-[#0a0a0a]">Querying Blockchain...</h2>
          <p className="mt-3 text-sm text-[#6b7280]">
            Searching the Polygon Amoy registry for document fingerprints.
          </p>
        </div>
      </VerificationLayout>
    );
  }

  if (error) {
    return (
      <VerificationLayout>
        <div className="text-center py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Network Error</h2>
          <p className="mt-3 text-sm text-[#6b7280] max-w-md mx-auto">
            {error}
          </p>
          <Button 
            className="mt-6 rounded-full shadow-none bg-[#0a0a0a]"
            onClick={() => window.location.reload()}
          >
            Retry Verification
          </Button>
        </div>
      </VerificationLayout>
    );
  }

  if (!record || !record.exists) {
    return (
      <VerificationLayout>
        <div className="text-center py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f3ef] mb-6">
            <Search className="h-8 w-8 text-[#6b7280]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Document Not Registered</h2>
          <p className="mt-3 text-sm text-[#6b7280] max-w-md mx-auto">
            This document fingerprint does not exist in the DocuShield blockchain registry. 
            It has not been issued or authorized by any recognized organisation on this network.
          </p>
          <div className="mt-8 mx-auto max-w-md bg-white border border-[#eae8e3] rounded-2xl p-4 text-left shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">Queried Fingerprint (SHA-256)</p>
            <p className="font-mono text-xs text-[#0a0a0a] break-all">{normalizedHash}</p>
          </div>
        </div>
      </VerificationLayout>
    );
  }

  return (
    <VerificationLayout>
      <div className="text-center">
        {record.active ? (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dcfce7] mb-6 shadow-[0_0_0_8px_rgba(220,252,231,0.5)]">
            <CheckCircle2 className="h-10 w-10 text-[#166534]" />
          </div>
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fef3c7] mb-6 shadow-[0_0_0_8px_rgba(254,243,199,0.5)]">
            <AlertTriangle className="h-10 w-10 text-[#92400e]" />
          </div>
        )}
        
        <h2 className={`text-3xl font-extrabold tracking-tight ${record.active ? 'text-[#166534]' : 'text-[#92400e]'}`}>
          {record.active ? "Document Verified" : "Document Revoked"}
        </h2>
        
        <p className="mt-3 text-sm text-[#6b7280] max-w-lg mx-auto">
          {record.active 
            ? "This exact document file has been cryptographically secured and registered on the Polygon Amoy blockchain by the issuer."
            : "This document was previously registered but has since been revoked by the issuer. It is no longer considered valid."}
        </p>

        <div className="mt-10 text-left bg-white border border-[#eae8e3] rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#eae8e3] bg-[#faf9f7] flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#0a0a0a]" />
            <h3 className="font-bold text-[#0a0a0a]">Blockchain Record</h3>
          </div>
          
          <div className="p-5 space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">Issuer Address</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#0a0a0a] font-medium truncate">
                  {record.issuer}
                </span>
                <CopyBtn text={record.issuer} />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">Document Fingerprint (SHA-256)</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#0a0a0a] font-medium truncate">
                  {record.documentHash}
                </span>
                <CopyBtn text={record.documentHash} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">Registration Date</p>
                <p className="text-sm text-[#0a0a0a] font-medium">
                  {new Date(record.registeredAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">Version</p>
                <p className="text-sm text-[#0a0a0a] font-mono">
                  v{record.version}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f4f3ef] space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6b7280]">Network</span>
                <span className="font-semibold text-[#0a0a0a] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                  Polygon Amoy
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6b7280]">Contract</span>
                <a 
                  href={`https://amoy.polygonscan.com/address/${DOCUSHIELD_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#0a0a0a] hover:underline flex items-center gap-1"
                >
                  {DOCUSHIELD_REGISTRY_ADDRESS.slice(0, 6)}...{DOCUSHIELD_REGISTRY_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {txHash && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280]">Transaction</span>
                  <a 
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#0a0a0a] hover:underline flex items-center gap-1"
                  >
                    {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-[#6b7280] max-w-sm mx-auto">
          DocuShield AI analyzes the document and creates a unique SHA-256 fingerprint, securely anchored to the blockchain.
        </div>
      </div>
    </VerificationLayout>
  );
}

function VerificationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#0a0a0a] font-sans selection:bg-[#0a0a0a] selection:text-white pb-20">
      {/* Sleek minimal navbar */}
      <nav className="border-b border-[#eae8e3] bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-[#0a0a0a] text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-lg">DocuShield</span>
            <span className="rounded-full bg-[#f4f3ef] px-2 py-0.5 text-[10px] font-bold text-[#6b7280] tracking-widest uppercase ml-1">
              Verify
            </span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            Learn more
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-5 pt-12 sm:pt-16">
        {children}
      </main>
    </div>
  );
}
