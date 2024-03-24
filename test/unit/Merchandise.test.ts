import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Merchandise } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Merchandise", () => {
        let Merchandise: Merchandise;
        let marketOwner: HardhatEthersSigner;
        let iotOwner: HardhatEthersSigner;
        let buyer: HardhatEthersSigner;

        beforeEach(async () => {
            [marketOwner, iotOwner, buyer] = await ethers.getSigners();
            const deploy = await deployments.deploy("Merchandise", {
                from: iotOwner.address,
                args: [
                    ethers.parseEther("0.01"),
                    ethers.encodeBytes32String("test"),
                ]
            });
            Merchandise = await ethers.getContractAt("Merchandise", deploy.address, iotOwner);
        });

        describe("Deployment", () => {
            it("Mechandise has right owner", async () => {
                const response = await Merchandise.getOwner();
                assert.equal(response, iotOwner.address);
            });

            it("Mechandise has DataHash", async () => {
                const response = await Merchandise.getDataHash();
                assert.equal(response, ethers.encodeBytes32String("test"));
            });

            it("Merchandise has no confirmed buyers", async () => {
                const response = await Merchandise.isConfirmedBuyer(buyer);
                assert.isFalse(response);
            });

            it("Merchandise has no progress buyers, and retrun 0.", async () => {
                const response = await Merchandise.getProgressBuyer();
                assert.equal(response, ethers.ZeroAddress);
            });
        })
    });