import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "dotenv/config";
import "./tasks/block-number";

const EHTERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const getCurrentTime = () => {
  const date = new Date();
  return date.toLocaleString('sv-SE');
}

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
      accounts: [
        PRIVATE_KEY!,
      ],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: EHTERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true
  },
  gasReporter: {
    enabled: true,
    noColors: true,
    outputFile: `logs/${getCurrentTime()}`,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
};

export default config;
