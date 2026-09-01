import { ethers } from "hardhat";

async function main() {
  console.log("--- Gas Estimation ---");
  const DocuShieldRegistry = await ethers.getContractFactory("DocuShieldRegistry");
  
  const deployTx = await DocuShieldRegistry.getDeployTransaction();
  
  const [signer] = await ethers.getSigners();
  const estimatedGas = await signer.estimateGas(deployTx);
  
  const feeData = await ethers.provider.getFeeData();
  
  console.log("Estimated Gas Units:", estimatedGas.toString());
  console.log("Gas Price (gwei):", ethers.formatUnits(feeData.gasPrice || 0, "gwei"));
  console.log("Max Fee Per Gas (gwei):", ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei"));
  console.log("Max Priority Fee (gwei):", ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, "gwei"));
  
  const cost = estimatedGas * (feeData.maxFeePerGas || feeData.gasPrice || 0n);
  console.log("Estimated Max Cost (POL):", ethers.formatEther(cost));
}

main().catch(console.error);
