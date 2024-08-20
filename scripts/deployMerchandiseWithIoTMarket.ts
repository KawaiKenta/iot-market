import { ethers, run, network } from "hardhat";
import "dotenv/config";

const main = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
  const pubKey = await ethers.deployContract("PubKey");
  await pubKey.waitForDeployment();
  console.log(`Contract "PubKey" with ${await pubKey.getAddress()} deployed`);

  const iotMarket = await ethers.deployContract(
    "IoTMarket",
    [await pubKey.getAddress()],
    marketOwner
  );
  await iotMarket.waitForDeployment();
  console.log(
    `Contract "IoTMarket" with ${await iotMarket.getAddress()} deployed`
  );
  // create datahash
  const digestArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("test")
  );
  const hashArray = new Uint8Array(digestArrayBuffer);
  const hash = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  for (let i = 0; i < 5; i++) {
    await iotMarket
      .connect(iotOwner)
      .deployMerchandise(ethers.parseEther("0.01"), "0x" + hash);
  }
  console.log(`datahash is 0x${hash}`);
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
