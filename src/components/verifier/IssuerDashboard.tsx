import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { useWallet } from "./WalletContext";
import { DOCUSHIELD_REGISTRY_ADDRESS, DOCUSHIELD_REGISTRY_ABI } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileBadge2,
  RefreshCw,
  Wallet,
  QrCode,
  Download,
} from "lucide-react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Helper for copy button
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
      className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// Format wallet address
const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export function IssuerDashboard() {
  const { account, isCorrectNetwork } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [qrHash, setQrHash] = useState<string | null>(null);

  const getPublicVerifyUrl = (hash: string) => {
    return `${window.location.origin}/verify/${hash}`;
  };

  const downloadQR = () => {
    const svg = document.getElementById("QRCode-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `DocuShield-QR-${qrHash?.slice(0, 8)}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const fetchRecords = useCallback(async () => {
    if (!account) return;
    
    setLoading(true);
    setError(null);
    try {
      const provider = window.ethereum 
        ? new BrowserProvider(window.ethereum)
        : new JsonRpcProvider(import.meta.env['VITE_AMOY_RPC_URL'] || "https://rpc-amoy.polygon.technology/");
      const contract = new Contract(DOCUSHIELD_REGISTRY_ADDRESS, DOCUSHIELD_REGISTRY_ABI, provider) as any;

      const filter = contract.filters.DocumentRegistered(null, null, account);
      
      const currentBlock = await provider.getBlockNumber();
      // Fetch the last ~2-3 days of blocks in chunks to avoid RPC limits
      const CHUNK_SIZE = 3000;
      const MAX_LOOKBACK = 100000;
      const startBlock = Math.max(0, currentBlock - MAX_LOOKBACK);
      
      let allLogs: any[] = [];
      
      for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE) {
        const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
        try {
          const chunkLogs = await contract.queryFilter(filter, from, to);
          allLogs = [...allLogs, ...chunkLogs];
        } catch (err) {
          console.warn(`Failed to fetch logs for block range ${from}-${to}`, err);
        }
      }

      // De-duplicate logs in case of overlap (though our ranges don't overlap)
      const uniqueLogs = Array.from(new Map(allLogs.map(log => [log.transactionHash, log])).values());

      // We must fetch the latest state from the documents mapping for each logged documentId
      const fetchedRecords = await Promise.all(
        uniqueLogs.map(async (log: any) => {
          const docId = log.args[0]; // documentId
          const txHash = log.transactionHash;
          const record = await contract.documents(docId);
          
          return {
            documentId: docId,
            documentHash: record[0],
            issuer: record[1],
            registeredAt: Number(record[2]) * 1000,
            version: Number(record[3]),
            active: record[4],
            exists: record[5],
            txHash: txHash
          };
        })
      );
      
      // Filter out any that don't exist anymore or don't match the issuer just in case
      const validRecords = fetchedRecords
        .filter(r => r.exists && r.issuer.toLowerCase() === account.toLowerCase())
        .sort((a, b) => b.registeredAt - a.registeredAt); // newest first

      setRecords(validRecords);
    } catch (err: any) {
      console.error("Failed to fetch blockchain records:", err);
      setError(err.message || "Failed to query the blockchain network.");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (!account) {
    return (
      <div className="rounded-2xl border border-dashed border-[#eae8e3] bg-[#faf9f7] py-12 px-6 text-center">
        <Wallet className="mx-auto h-8 w-8 text-[#9ca3af]" />
        <p className="mt-3 text-sm font-semibold text-[#0a0a0a]">No wallet connected</p>
        <p className="mt-1 text-xs text-[#6b7280]">
          Connect your MetaMask wallet to view documents registered to your identity.
        </p>
      </div>
    );
  }

  const activeCount = records.filter(r => r.active).length;
  const revokedCount = records.filter(r => !r.active).length;

  return (
    <div className="space-y-6">
      {/* Network & Identity Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#0a0a0a]">Issuer Identity</h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
              {formatAddress(account)}
              <CopyBtn text={account} />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isCorrectNetwork ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success"></span> Polygon Amoy
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive border border-destructive/20">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive"></span> Wrong Network
            </span>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 text-xs rounded-full shadow-none border-[#eae8e3]"
            onClick={fetchRecords}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Registered</p>
          <p className="mt-2 text-3xl font-bold text-[#0a0a0a]">{records.length}</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 shadow-sm">
          <p className="text-xs font-semibold text-success uppercase tracking-wider">Active Documents</p>
          <p className="mt-2 text-3xl font-bold text-success">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 shadow-sm">
          <p className="text-xs font-semibold text-warning uppercase tracking-wider">Revoked</p>
          <p className="mt-2 text-3xl font-bold text-warning">{revokedCount}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="rounded-xl border border-[#eae8e3] bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#eae8e3] bg-[#faf9f7]">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-[#0a0a0a]">
            <FileBadge2 className="h-4 w-4 text-[#6b7280]" />
            Registry Records
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
            <Activity className="h-6 w-6 animate-pulse mb-3 opacity-60" />
            Loading blockchain records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive text-sm flex flex-col items-center justify-center">
            <AlertTriangle className="h-6 w-6 mb-3 opacity-80" />
            <p className="font-semibold mb-1">Failed to read blockchain</p>
            <p className="text-xs opacity-80 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRecords} className="shadow-none border-[#eae8e3]">Try Again</Button>
          </div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
            <FileBadge2 className="h-10 w-10 mb-4 opacity-30" />
            <p className="font-medium text-[#0a0a0a]">No documents registered yet.</p>
            <p className="text-xs mt-1 text-[#6b7280]">Your registered document hashes will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#faf9f7] text-[#6b7280] text-[11px] font-semibold uppercase tracking-wider border-b border-[#eae8e3]">
                <tr>
                  <th className="px-4 py-3">Document Hash</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee8]">
                {records.map((record, i) => (
                  <tr key={i} className="hover:bg-[#faf9f7] transition-colors group">
                    <td className="px-4 py-3.5 font-mono text-xs text-[#0a0a0a]">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px] sm:max-w-[160px] inline-block font-medium">
                          {record.documentHash.replace("0x", "")}
                        </span>
                        <CopyBtn text={record.documentHash.replace("0x", "")} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#6b7280] whitespace-nowrap text-xs">
                      {new Date(record.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {record.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success border border-success/10">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning border border-warning/10">
                          <AlertTriangle className="h-3 w-3" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#6b7280] font-mono text-center sm:text-left text-xs">
                      v{record.version}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {record.txHash && (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${record.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-full hover:bg-black/5 text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
                          title="View Transaction"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setQrHash(record.documentHash)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-full hover:bg-black/5 text-[#6b7280] hover:text-[#0a0a0a] transition-colors ml-1"
                        title="Generate QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrHash} onOpenChange={(open) => !open && setQrHash(null)}>
        <DialogContent className="sm:max-w-md border-[#eae8e3] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#0a0a0a]">Document QR Code</DialogTitle>
            <DialogDescription className="text-xs text-[#6b7280]">
              Anyone can scan this to instantly verify the document on the blockchain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-6 bg-[#faf9f7] border border-[#eae8e3] rounded-2xl my-2">
            {qrHash && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#eae8e3]">
                <QRCode
                  id="QRCode-svg"
                  value={getPublicVerifyUrl(qrHash)}
                  size={200}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                />
              </div>
            )}
            <p className="mt-4 font-mono text-[10px] text-[#6b7280] max-w-[250px] truncate text-center bg-white px-2 py-1 rounded border border-[#eae8e3]">
              {qrHash}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={qrHash ? getPublicVerifyUrl(qrHash) : ""} 
                className="flex-1 h-9 rounded-xl border border-[#eae8e3] bg-[#faf9f7] px-3 text-xs text-[#6b7280] font-mono outline-none"
              />
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 rounded-xl border-[#eae8e3] shadow-none"
                onClick={() => {
                  if (qrHash) {
                    navigator.clipboard.writeText(getPublicVerifyUrl(qrHash));
                    toast.success("Public verification URL copied!");
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              className="w-full rounded-full bg-[#0a0a0a] text-white hover:bg-[#262626] h-10 font-semibold shadow-none"
              onClick={downloadQR}
            >
              <Download className="h-4 w-4 mr-2" /> Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
