import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { POLYGON_AMOY_CHAIN_ID_HEX } from "@/lib/contracts";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  account: string | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!window.ethereum) return;
    
    const checkNetwork = async () => {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        setIsCorrectNetwork(chainId === POLYGON_AMOY_CHAIN_ID_HEX);
      } catch (e) {
        console.error(e);
      }
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0] || null);
      } else {
        setAccount(null);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setIsCorrectNetwork(chainId === POLYGON_AMOY_CHAIN_ID_HEX);
    };

    checkNetwork();
    
    // Check if already connected
    window.ethereum.request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch(console.error);

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed. Please install it to connect.");
      return;
    }
    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0] || null);
      }
      
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setIsCorrectNetwork(chainId === POLYGON_AMOY_CHAIN_ID_HEX);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY_CHAIN_ID_HEX }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: POLYGON_AMOY_CHAIN_ID_HEX,
                chainName: "Polygon Amoy",
                rpcUrls: ["https://rpc-amoy.polygon.technology/"],
                nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
                blockExplorerUrls: ["https://amoy.polygonscan.com/"],
              },
            ],
          });
        } catch (addError: any) {
          toast.error(addError.message || "Failed to add Polygon Amoy network.");
        }
      } else {
        toast.error(err.message || "Failed to switch network.");
      }
    }
  };

  return (
    <WalletContext.Provider value={{ account, isCorrectNetwork, isConnecting, connect, switchNetwork }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
