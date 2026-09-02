import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Because vite imports of json outside src might be tricky, we'll read the ABI file directly using fs
function getArtifact() {
  const artifactPath = path.resolve(process.cwd(), "blockchain/artifacts/contracts/DocuShieldRegistry.sol/DocuShieldRegistry.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Contract artifact not found. Please run 'npx hardhat compile' in the blockchain directory.");
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
}

function getEthers() {
  const mode = process.env["BLOCKCHAIN_MODE"] || "local";
  
  let rpcUrl = "";
  let privateKey = "";
  
  if (mode === "local") {
    rpcUrl = process.env["LOCAL_RPC_URL"] || "http://127.0.0.1:8545";
    privateKey = process.env["LOCAL_PRIVATE_KEY"] || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  } else {
    rpcUrl = process.env["AMOY_RPC_URL"] || "";
    privateKey = process.env["PRIVATE_KEY"] || "";
  }
  
  if (!rpcUrl || !privateKey) {
    throw new Error(`Blockchain credentials missing for mode: ${mode}`);
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  
  return { provider, signer, mode };
}

export const deployContractFn = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const artifact = getArtifact();
      const { signer, mode } = getEthers();
      
      const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        signer
      );
      
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      const tx = contract.deploymentTransaction();
      
      return { 
        success: true, 
        address,
        txHash: tx?.hash,
        mode 
      };
    } catch (err: any) {
      if (err.code === 'UND_ERR_CONNECT_TIMEOUT' || (err.message && err.message.includes('could not detect network'))) {
         throw new Error("Local Hardhat node is not running. Please run 'npx hardhat node' in the blockchain directory.");
      }
      throw new Error("Deploy failed: " + err.message);
    }
  });

export const registerDocumentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ contractAddress: z.string(), documentId: z.string(), documentHash: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const artifact = getArtifact();
      const { signer, mode } = getEthers();
      const contract = new ethers.Contract(data.contractAddress, artifact.abi, signer) as any;
      
      const idBytes32 = ethers.id(data.documentId);
      const hashParam = data.documentHash.startsWith('0x') ? data.documentHash : `0x${data.documentHash}`;

      const tx = await contract.registerDocument(idBytes32, hashParam);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        issuer: signer.address,
        mode
      };
    } catch (err: any) {
      throw new Error("Register failed: " + (err.reason || err.message));
    }
  });

export const verifyOnChainFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ contractAddress: z.string(), documentId: z.string(), suppliedHash: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const artifact = getArtifact();
      const { provider } = getEthers();
      const contract = new ethers.Contract(data.contractAddress, artifact.abi, provider) as any;
      
      const idBytes32 = ethers.id(data.documentId);
      const hashParam = data.suppliedHash.startsWith('0x') ? data.suppliedHash : `0x${data.suppliedHash}`;

      const [isActive, hashMatches] = await contract.verifyDocument(idBytes32, hashParam);
      
      return {
        success: true,
        isActive,
        hashMatches
      };
    } catch (err: any) {
      throw new Error("Verification failed: " + (err.reason || err.message));
    }
  });

export const revokeDocumentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ contractAddress: z.string(), documentId: z.string(), reason: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const artifact = getArtifact();
      const { signer, mode } = getEthers();
      const contract = new ethers.Contract(data.contractAddress, artifact.abi, signer) as any;
      
      const idBytes32 = ethers.id(data.documentId);
      
      const tx = await contract.revokeDocument(idBytes32, data.reason);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        mode
      };
    } catch (err: any) {
      throw new Error("Revoke failed: " + (err.reason || err.message));
    }
  });

export const createVersionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ contractAddress: z.string(), documentId: z.string(), newHash: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const artifact = getArtifact();
      const { signer, mode } = getEthers();
      const contract = new ethers.Contract(data.contractAddress, artifact.abi, signer) as any;
      
      const idBytes32 = ethers.id(data.documentId);
      const hashParam = data.newHash.startsWith('0x') ? data.newHash : `0x${data.newHash}`;
      
      const tx = await contract.createVersion(idBytes32, hashParam);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        mode
      };
    } catch (err: any) {
      throw new Error("Version update failed: " + (err.reason || err.message));
    }
  });
