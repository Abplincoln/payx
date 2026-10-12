const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    console.error("=".repeat(60));
    console.error("No deployer account configured.");
    console.error("=".repeat(60));
    console.error("Set BOTCHAIN_MAINNET_PRIVATE_KEY or BOTCHAIN_PRIVATE_KEY in .env");
    console.error("Never prefix private keys with VITE_ or commit them.");
    process.exitCode = 1;
    return;
  }

  const [deployer] = signers;
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("=".repeat(60));
  console.log("Deploying MedicalBilling to BOT Chain Mainnet");
  console.log("=".repeat(60));
  console.log("Network chain ID: ", network.chainId.toString());
  console.log("Deployer address: ", deployerAddress);

  if (network.chainId !== 677n) {
    console.error(`ERROR: Expected chain ID 677 for BOT Chain Mainnet, but got ${network.chainId.toString()}`);
    process.exitCode = 1;
    return;
  }

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Deployer balance: ", ethers.formatEther(balance), "BOT");

  if (balance === 0n) {
    console.error("ERROR: Deployer has 0 balance on BOT Chain Mainnet.");
    process.exitCode = 1;
    return;
  }

  // Deploy existing MedicalBilling contract
  console.log("\nDeploying existing MedicalBilling contract...");
  const MedicalBilling = await ethers.getContractFactory("MedicalBilling");
  const medicalBilling = await MedicalBilling.deploy();

  console.log("Deployment transaction submitted. Waiting for confirmation...");
  await medicalBilling.waitForDeployment();

  const address = await medicalBilling.getAddress();
  const deploymentTx = medicalBilling.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Confirmed on BOT Chain Mainnet");
  console.log("=".repeat(60));
  console.log("Contract address: ", address);
  console.log("Transaction hash: ", txHash);
  console.log("Explorer link:    ", `https://scan.botchain.ai/address/${address}`);

  // Wait for receipt
  let blockNumber = null;
  if (deploymentTx) {
    console.log("\nFetching deployment transaction receipt...");
    const receipt = await deploymentTx.wait(1);
    if (receipt && receipt.status === 1) {
      blockNumber = receipt.blockNumber;
      console.log(`Transaction status: SUCCESS (confirmed in block ${blockNumber})`);
    } else {
      console.error("Transaction status: FAILED");
      process.exitCode = 1;
      return;
    }
  }

  // Post-deployment read check
  console.log("\nPerforming post-deployment read check...");
  try {
    const totalBills = await medicalBilling.getTotalBills();
    console.log("getTotalBills() returned:", totalBills.toString());
    console.log("Contract is readable on BOT Chain Mainnet: YES");
  } catch (err) {
    console.error("Contract read check FAILED:", err.message);
    process.exitCode = 1;
    return;
  }

  // Save deployment record
  const deploymentRecord = {
    network: "BOT Chain Mainnet",
    chainId: 677,
    rpcUrl: "https://rpc.botchain.ai",
    explorerUrl: "https://scan.botchain.ai",
    contractName: "MedicalBilling",
    contractAddress: address,
    transactionHash: txHash,
    blockNumber: blockNumber,
    deployerAddress: deployerAddress,
    deployedAt: new Date().toISOString(),
    status: "deployed",
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const recordPath = path.join(deploymentsDir, "mainnet.json");
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2), "utf8");
  console.log(`\nMainnet deployment record saved to: ${recordPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Status:             SUCCESS");
  console.log("Contract address:  ", address);
  console.log("Transaction hash:  ", txHash);
  console.log("Block number:      ", blockNumber);
  console.log("Network chain ID:  ", network.chainId.toString());
  console.log("Deployer address:  ", deployerAddress);
  console.log("Block Explorer:    ", `https://scan.botchain.ai/address/${address}`);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
