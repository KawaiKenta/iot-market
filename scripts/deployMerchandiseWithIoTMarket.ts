import { ethers, run, network } from "hardhat";
import "dotenv/config";

const main = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
  const iotMarket = await ethers.deployContract("IoTMarket");
  await iotMarket.waitForDeployment();
  console.log(
    `Contract "IoTMarket" with ${await iotMarket.getAddress()} deployed`
  );

  for (let i = 0; i < 5; i++) {
    await iotMarket
      .connect(iotOwner)
      .deployMerchandise(
        ethers.parseEther("0.01"),
        ethers.encodeBytes32String("test")
      );
  }
  const merchandises = [];
  const merchandiseAddressies = await iotMarket.getMerchandises();
  for (const address of merchandiseAddressies) {
    const merchandise = await ethers.getContractAt("Merchandise", address);
    merchandises.push(merchandise);
  }
  for (const merchandise of merchandises) {
    console.log(
      `Merchandise Address: ${await merchandise.getAddress()}, signer : ${await merchandise.getOwner()}`
    );
  }
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
