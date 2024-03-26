import { ethers, network } from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { developmentChains } from "../../helper-hardhat-config";

const deployFixture = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
  const IotMarketFactory = await ethers.getContractFactory(
    "IoTMarket",
    marketOwner
  );
  const IoTMarket = await IotMarketFactory.deploy();
  console.log("IoTMarket deployed at", await IoTMarket.getAddress());
  return { marketOwner, iotOwner, buyer, IoTMarket };
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
      });
    });
