import { deployments, ethers, network } from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { assert, expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { developmentChains } from "../../helper-hardhat-config";
import { IoTMarket } from "../../typechain-types";

const deployFixture = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
  const deploy = await deployments.deploy("IoTMarket", {
    from: marketOwner.address,
  });
  const IoTMarket = await ethers.getContractAt(
    "IoTMarket",
    deploy.address,
    marketOwner
  );
  console.log("IoTMarket deployed at", await IoTMarket.getAddress());
  return { marketOwner, iotOwner, buyer, IoTMarket };
};

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("IoTMarket", () => {
      beforeEach(async () => {
        const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
        const deploy = await deployments.fixture(["IoTMarket"]);
        const iotMarket = await ethers.getContractAt(
          "IoTMarket",
          deploy["IoTMarket"].address,
          marketOwner
        );
      });

      describe("Deployment", () => {
        it("There are no Merchandises", async () => {
          const { marketOwner, iotOwner, buyer, IoTMarket } = await loadFixture(
            deployFixture
          );
          const response = await IoTMarket.getMerchandises();
          assert.isEmpty(response);
        });
      });
    });
