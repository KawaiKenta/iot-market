import { ethers, run, network } from "hardhat";
import "dotenv/config";

const main = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
  let merchandise = await ethers.deployContract(
    "Merchandise",
    [ethers.parseEther("0.01"), ethers.encodeBytes32String("test")],
    iotOwner
  );
  await merchandise.waitForDeployment();
  console.log(
    `Contract "Merchandise" with ${await merchandise.getAddress()} deployed`
  );
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
