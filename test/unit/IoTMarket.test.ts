import { deployments, ethers, network } from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { assert, expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { developmentChains } from "../../helper-hardhat-config";
import { IoTMarket } from "../../typechain-types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("IoTMarket", () => {
        let iotMarket: IoTMarket;
        let marketOwner: HardhatEthersSigner;
        let iotOwner: HardhatEthersSigner;
        let buyer: HardhatEthersSigner;
        beforeEach(async () => {
            [marketOwner, iotOwner, buyer] = await ethers.getSigners();
            const deploy = await deployments.fixture(["IoTMarket"]);
            iotMarket = await ethers.getContractAt("IoTMarket", deploy["IoTMarket"].address, marketOwner);
        });

        describe("Deployment", () => {
            it("There are no Merchandises", async () => {
                const response = await iotMarket.getMerchandises();
                assert.isEmpty(response);
            })
        });
    })