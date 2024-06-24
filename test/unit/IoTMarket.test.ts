import { ethers, network } from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { developmentChains } from "../../helper-hardhat-config";

const deployFixture = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();

  const pubKeyFactory = await ethers.getContractFactory("PubKey", marketOwner);
  const pubKey = await pubKeyFactory.deploy();

  const IotMarketFactory = await ethers.getContractFactory(
    "IoTMarket",
    marketOwner
  );
  const IoTMarket = await IotMarketFactory.deploy(pubKey);
  return { marketOwner, iotOwner, buyer, pubKey, IoTMarket };
};

const merchandisesFixture = async () => {
  const { marketOwner, iotOwner, buyer, pubKey, IoTMarket } = await loadFixture(
    deployFixture
  );
  for (let i = 0; i < 5; i++) {
    await IoTMarket.connect(iotOwner).deployMerchandise(
      ethers.parseEther("0.01"),
      ethers.encodeBytes32String("test")
    );
  }
  const merchandises = [];
  const merchandiseAddresses = await IoTMarket.getMerchandises();
  for (const address of merchandiseAddresses) {
    const merchandise = await ethers.getContractAt("Merchandise", address);
    merchandises.push(merchandise);
  }
  return { marketOwner, iotOwner, buyer, IoTMarket, pubKey, merchandises };
};

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("IoTMarket", () => {
      describe("Deployment", () => {
        it("There are no Merchandises", async () => {
          const { IoTMarket } = await loadFixture(deployFixture);
          const response = await IoTMarket.getMerchandises();
          assert.isEmpty(response);
        });
        it("PubKey is deployed", async () => {
          const { pubKey, IoTMarket } = await loadFixture(deployFixture);
          const pubKeyAddress = await IoTMarket.getPubKeyAddress();
          assert.equal(await pubKey.getAddress(), pubKeyAddress);
        });
      });
      describe("Deploy Merchandiseis", () => {
        it("There are 5 Merchandises", async () => {
          const { IoTMarket } = await loadFixture(merchandisesFixture);
          const response = await IoTMarket.getMerchandises();
          assert.isNotEmpty(response);
          assert.lengthOf(response, 5);
        });
        it("Every Merchandise has correct owner", async () => {
          const { IoTMarket, iotOwner, merchandises } = await loadFixture(
            merchandisesFixture
          );
          for (const merchandise of merchandises) {
            const owner = await merchandise.getOwner();
            assert.equal(iotOwner.address, owner);
          }
        });
      });
    });
