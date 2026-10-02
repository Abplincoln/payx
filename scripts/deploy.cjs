const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    console.error("=".repeat(60));
    console.error("No deployer account configured.");
    console.error("=".repeat(60));
    console.error("Set BOTCHAIN_PRIVATE_KEY in the .env file before deploying.");
    console.error("The key must never use a VITE_ prefix or be committed to version control.");
    process.exitCode = 1;
    return;
  }

  const [deployer] = signers;
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("=".repeat(60));
  console.log("Deploying MedicalBilling to BotChain Testnet");
  console.log("=".repeat(60));
  console.log("Network chain ID:", network.chainId.toString());
  console.log("Deployer address:", deployerAddress);

  // Check deployer balance before deployment
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Deployer balance:", ethers.formatEther(balance), "BOT");

  if (balance === 0n) {
    console.error("ERROR: Deployer has 0 balance. Fund the wallet with testnet BOT before deploying.");
    process.exitCode = 1;
    return;
  }

  // Deploy
  const MedicalBilling = await ethers.getContractFactory("MedicalBilling");
  console.log("\nDeploying contract...");
  const medicalBilling = await MedicalBilling.deploy();

  await medicalBilling.waitForDeployment();

  const address = await medicalBilling.getAddress();
  const deploymentTx = medicalBilling.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Successful");
  console.log("=".repeat(60));
  console.log("Contract address:", address);
  console.log("Transaction hash:", txHash);

    // Verify deployment transaction
  if (deploymentTx) {
    console.log("\nVerifying deployment transaction...");
    const receipt = await deploymentTx.wait();

    if (receipt && receipt.status === 1) {
      console.log(
        "Transaction status: SUCCESS (confirmed in block",
        receipt.blockNumber + ")"
      );
    } else {
      console.error("Transaction status: FAILED");
      process.exitCode = 1;
      return;
    }
  }

  // Post-deployment read check: call getTotalBills() to verify the contract is live
  console.log("\nPerforming post-deployment read check...");
  try {
    const totalBills = await medicalBilling.getTotalBills();
    console.log("getTotalBills() returned:", totalBills.toString());
    console.log("Contract is readable on BotChain: YES");
  } catch (err) {
    console.error("Contract read check FAILED:", err.message);
    process.exitCode = 1;
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Status:             SUCCESS");
  console.log("Contract address:  ", address);
  console.log("Transaction hash:  ", txHash);
  console.log("Network chain ID:  ", network.chainId.toString());
  console.log("Deployer address:  ", deployerAddress);
  console.log("ABI artifact:       artifacts/contracts/MedicalBilling.sol/MedicalBilling.json");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
