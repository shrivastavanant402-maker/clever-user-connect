import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  deployContractFn, 
  registerDocumentFn, 
  verifyOnChainFn, 
  revokeDocumentFn, 
  createVersionFn 
} from "@/lib/blockchain.functions";
import { Loader2, Database, ShieldCheck, XCircle } from "lucide-react";

export function BlockchainPanel({ documentHash, documentName }: { documentHash: string, documentName: string }) {
  const [contractAddress, setContractAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  
  const handleRequest = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError("");
    try {
      const res = await fn();
      setResult(res);
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = () => handleRequest(async () => {
    const res = await deployContractFn();
    setContractAddress(res.address);
    return res;
  });

  const handleRegister = () => handleRequest(() => registerDocumentFn({
    data: { contractAddress, documentId: documentName, documentHash }
  }));

  const handleVerify = () => handleRequest(() => verifyOnChainFn({
    data: { contractAddress, documentId: documentName, suppliedHash: documentHash }
  }));

  const handleRevoke = () => handleRequest(() => revokeDocumentFn({
    data: { contractAddress, documentId: documentName, reason: "Revoked via Demo UI" }
  }));

  const handleVersion = () => handleRequest(() => createVersionFn({
    data: { contractAddress, documentId: documentName, newHash: documentHash }
  }));

  return (
    <div className="rounded-lg bg-secondary/20 p-4 border border-border mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-primary" />
          Blockchain Controls
        </h3>
        <Badge variant="default" className="bg-primary text-primary-foreground">
          Local Blockchain Demo
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input 
            value={contractAddress} 
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Contract Address (Deploy or Paste)"
            className="h-8 text-xs font-mono bg-background"
          />
          <Button size="sm" variant="outline" onClick={handleDeploy} disabled={loading} className="h-8 shrink-0">
            Deploy
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleRegister} disabled={!contractAddress || loading} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
            Register Hash
          </Button>
          <Button size="sm" variant="secondary" onClick={handleVerify} disabled={!contractAddress || loading} className="h-8 bg-green-600 hover:bg-green-700 text-white">
            Verify Hash
          </Button>
          <Button size="sm" variant="destructive" onClick={handleRevoke} disabled={!contractAddress || loading} className="h-8">
            Revoke
          </Button>
          <Button size="sm" variant="outline" onClick={handleVersion} disabled={!contractAddress || loading} className="h-8">
            New Version
          </Button>
        </div>

        {loading && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin"/> Processing transaction...</div>}
        
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-2">
            <XCircle className="h-3 w-3 shrink-0" /> {error}
          </div>
        )}

        {result && !error && (
          <div className="text-xs bg-background p-3 rounded border border-border space-y-1 font-mono">
            {result.mode && <p><span className="text-muted-foreground">Network:</span> {result.mode}</p>}
            {result.txHash && <p><span className="text-muted-foreground">Tx Hash:</span> <span className="text-primary truncate block" title={result.txHash}>{result.txHash.substring(0, 30)}...</span></p>}
            {result.blockNumber && <p><span className="text-muted-foreground">Block:</span> {result.blockNumber}</p>}
            {result.issuer && <p><span className="text-muted-foreground">Issuer:</span> {result.issuer}</p>}
            {result.address && <p><span className="text-muted-foreground">Deployed To:</span> {result.address}</p>}
            
            {result.isActive !== undefined && (
              <div className="mt-2 p-2 rounded bg-secondary/50 font-sans">
                <p className="font-semibold flex items-center gap-1">
                  {result.hashMatches ? <ShieldCheck className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  {result.hashMatches ? <span className="text-success">VERIFIED — Hash Matches</span> : <span className="text-destructive">MISMATCH — Hash does not match</span>}
                </p>
                <p className="text-muted-foreground mt-1">Status: {result.isActive ? "Active" : "Revoked"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
