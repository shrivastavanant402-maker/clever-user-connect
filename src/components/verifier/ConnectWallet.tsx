import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle } from "lucide-react";
import { useWallet } from "./WalletContext";

export function ConnectWallet() {
  const { account, isCorrectNetwork, isConnecting, connect, switchNetwork } = useWallet();

  if (account && !isCorrectNetwork) {
    return (
      <Button variant="destructive" onClick={switchNetwork} className="gap-2">
        <AlertCircle className="w-4 h-4" />
        Switch to Polygon Amoy
      </Button>
    );
  }

  if (account) {
    return (
      <Button variant="outline" className="gap-2 font-mono">
        <Wallet className="w-4 h-4 text-primary" />
        {account.slice(0, 6)}...{account.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={connect} disabled={isConnecting} className="gap-2">
      <Wallet className="w-4 h-4" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
