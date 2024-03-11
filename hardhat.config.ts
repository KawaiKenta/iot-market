import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "dotenv/config";
import "./tasks/block-number";

const EHTERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_USER_0 = process.env.SEPOLIA_USER_0 || "";
const SEPOLIA_USER_1 = process.env.SEPOLIA_USER_1 || "";
const SEPOLIA_USER_2 = process.env.SEPOLIA_USER_2 || "";

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
        SEPOLIA_USER_0,
        SEPOLIA_USER_1,
        SEPOLIA_USER_2,
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
    enabled: (process.env.REPORT_GAS) ? true : false,
    noColors: true,
    outputFile: `logs/${getCurrentTime()}`,
  },
  namedAccounts: {
    marketOwner: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      11155111: 0,
    },
    iotOwner: {
      default: 1, // here this will by default take the second account as deployer
      1: 1, // similarly on mainnet it will take the second account as deployer. Note though that depending on how hardhat network are configured, the account 1 on one network can be different than on another
      11155111: 1,
    },
    buyer: {
      default: 2, // here this will by default take the third account as deployer
      1: 2, // similarly on mainnet it will take the third account as deployer. Note though that depending on how hardhat network are configured, the account 2 on one network can be different than on another
      11155111: 2,
    }
  },
};

export default config;
