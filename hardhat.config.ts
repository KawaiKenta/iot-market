import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const EHTERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_USER_0 = process.env.SEPOLIA_USER_0 || "";
const SEPOLIA_USER_1 = process.env.SEPOLIA_USER_1 || "";
const SEPOLIA_USER_2 = process.env.SEPOLIA_USER_2 || "";

const getCurrentTime = () => {
  const date = new Date();
  return date.toLocaleString("sv-SE");
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_USER_0, SEPOLIA_USER_1, SEPOLIA_USER_2],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: EHTERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    noColors: true,
    outputFile: `logs/${getCurrentTime()}`,
  },
};

export default config;
