require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const BOTCHAIN_RPC_URL = process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life";
const BOTCHAIN_PRIVATE_KEY = process.env.BOTCHAIN_PRIVATE_KEY || "";

const BOTCHAIN_MAINNET_RPC_URL = process.env.BOTCHAIN_MAINNET_RPC_URL || "https://rpc.botchain.ai";
const BOTCHAIN_MAINNET_PRIVATE_KEY = process.env.BOTCHAIN_MAINNET_PRIVATE_KEY || BOTCHAIN_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    botchain: {
      url: BOTCHAIN_RPC_URL,
      chainId: 968,
      accounts: BOTCHAIN_PRIVATE_KEY ? [BOTCHAIN_PRIVATE_KEY] : [],
    },
    botchainTestnet: {
      url: BOTCHAIN_RPC_URL,
      chainId: 968,
      accounts: BOTCHAIN_PRIVATE_KEY ? [BOTCHAIN_PRIVATE_KEY] : [],
    },
    botchainMainnet: {
      url: BOTCHAIN_MAINNET_RPC_URL,
      chainId: 677,
      accounts: BOTCHAIN_MAINNET_PRIVATE_KEY ? [BOTCHAIN_MAINNET_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      botchainMainnet: "empty",
    },
    customChains: [
      {
        network: "botchainMainnet",
        chainId: 677,
        urls: {
          apiURL: "https://scan.botchain.ai/api",
          browserURL: "https://scan.botchain.ai",
        },
      },
    ],
  },
};

