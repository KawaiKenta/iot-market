import { ethers, run, network } from "hardhat";
import "dotenv/config";

const main = async () => {
  console.log(`Deploying Contract...`);
  let merchandise = await ethers.deployContract("Merchandise");
  await merchandise.waitForDeployment();
  console.log(
    `Contract "Merchandise" with ${await merchandise.getAddress()} deployed`
  );

  if (network.config.chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    console.log("network is not Hardhat: verify() will run");
    console.log(`wait for a moment for Etherscan gets the byte code`);
    await merchandise.deploymentTransaction()?.wait(5);
    console.log(`Verifying the contract on Etherscan...`);
    await run("verify:verify", {
      address: await merchandise.getAddress(),
      constructorArguments: [],
    })
      .then(() => {
        console.log(`Contract verified!`);
      })
      .catch((error: Error) => {
        console.log(`Error while running verify:verify: ${error.message}`);
      });
  }
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
