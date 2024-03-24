import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Merchandise, Merchandise__factory } from "../../typechain-types";
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
            it("Merchandise has const Retry limit(10)", async () => {
                const response = await Merchandise.getRetryLimit();
                assert.equal(response, 10n);
            })

            it("Merchandise has right owner", async () => {
                const response = await Merchandise.getOwner();
                assert.equal(response, iotOwner.address);
            });

            it("Merchandise has DataHash", async () => {
                const response = await Merchandise.getDataHash();
                assert.equal(response, ethers.encodeBytes32String("test"));
            });

            it("Merchandise has initial price", async () => {
                const response = await Merchandise.getPrice();
                assert.equal(response, ethers.parseEther("0.01"));
            });

            it("Merchandise has initial state as SALE", async () => {
                const response = await Merchandise.getState();
                // FIXME: use enum instead of number
                assert.equal(response, 0n);
            })

            it("Merchandise has trial count as 0", async () => {
                const response = await Merchandise.getTrialCount();
                assert.equal(response, 0n);
            });

            it("Merchandise has no progress buyers", async () => {
                const response = await Merchandise.getProgressBuyer();
                assert.equal(response, ethers.ZeroAddress);
            });

            it("Merchandise has no confirmed buyers", async () => {
                const user1 = await Merchandise.isConfirmedBuyer(buyer.address);
                const user2 = await Merchandise.isConfirmedBuyer(iotOwner.address);
                const user3 = await Merchandise.isConfirmedBuyer(marketOwner.address);
                for (const user of [user1, user2, user3]) {
                    assert.isFalse(user);
                }
            });
        })
    });