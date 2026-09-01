import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  const DocuShieldRegistry = await ethers.getContractFactory("DocuShieldRegistry");
  const registry = await DocuShieldRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log(`DocuShieldRegistry deployed to: ${address}`);
  
  // Note: we can also log transaction hash using registry.deploymentTransaction()?.hash
  const txHash = registry.deploymentTransaction()?.hash;
  console.log(`Deployment Transaction Hash: ${txHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
