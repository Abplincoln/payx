const { ethers } = require("ethers");

async function check() {
  const provider = new ethers.JsonRpcProvider("https://rpc.botchain.ai");
  const addr = "0x545B697201cB19DdFF7d68FBd60158dc454aaef7";
  const txHash = "0xbfd97be2e58298d34ef75c9be3a94c419664c585e40ee021663205e0cbb672ef";

  console.log("Checking contract code...");
  const code = await provider.getCode(addr);
  console.log("Bytecode length:", code.length, "characters");
  console.log("Has deployed bytecode:", code !== "0x");

  console.log("\nChecking transaction receipt...");
  const receipt = await provider.getTransactionReceipt(txHash);
  if (receipt) {
    console.log("Receipt Status:", receipt.status === 1 ? "SUCCESS (1)" : "FAILED (0)");
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
  } else {
    console.log("Receipt not found yet.");
  }

  console.log("\nReading contract view functions...");
  const abi = [
    "function totalBills() view returns (uint256)",
    "function isProviderRegistered(address) view returns (bool)"
  ];
  const contract = new ethers.Contract(addr, abi, provider);
  const totalBills = await contract.totalBills();
  console.log("totalBills():", totalBills.toString());
  const isReg = await contract.isProviderRegistered("0x4093dAfCC3f60B5491C6Cd694f07F03fDA86919a");
  console.log("isProviderRegistered(deployer):", isReg);
}

check().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
