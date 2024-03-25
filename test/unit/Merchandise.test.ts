import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Merchandise } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";

const MerchandiseState = {
    SALE: 0n,
    IN_PROGRESS: 1n,
    BANNED: 2n,
}

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
                const user1 = await Merchandise.isConfirmedBuyer(buyer);
                const user2 = await Merchandise.isConfirmedBuyer(iotOwner);
                const user3 = await Merchandise.isConfirmedBuyer(marketOwner);
                for (const user of [user1, user2, user3]) {
                    assert.isFalse(user);
                }
            });
        })

        describe("At state SALE", () => {
            it("Failed if someone try to confirm", async () => {
                await expect(Merchandise.connect(buyer)
                    .verify(ethers.encodeBytes32String("test"))).to.be.revertedWithCustomError(Merchandise, "Merchandise__NotInProgress");
            });
        })

        describe("Purchase", () => {
            it("Fails if buyer don't send enough money", async () => {
                await Merchandise.connect(buyer);
                await expect(Merchandise.purchase()).to.be.revertedWithCustomError(Merchandise, "Merchandise__NotEnoughETH")
            });

            it("Buyer can purchase merchandise", async () => {
                await Merchandise.connect(buyer).purchase({ value: ethers.parseEther("0.01") });
                const buyerAddress = await Merchandise.getProgressBuyer();
                const state = await Merchandise.getState();
                assert.equal(buyerAddress, buyer.address);
                assert.equal(state, MerchandiseState.IN_PROGRESS);
            });
        });

        describe("At state IN_PROGRESS", () => {
            it("No other user can purchase", async () => {
                await expect(Merchandise.connect(iotOwner)
                    .purchase({ value: ethers.parseEther("0.01") }))
                    .to.be.revertedWithCustomError(Merchandise, "Merchandise__NotForSale");
            });

            it("Failed if someone without buyer try to confirm", async () => {
                await expect(Merchandise.connect(iotOwner)
                    .verify(ethers.encodeBytes32String("test"))).to.be.revertedWithCustomError(Merchandise, "Merchandise__NotBuyer");
            });

            it("Failed if buyer try to confirm with wrong data", async () => {
                const wrongHash = ethers.encodeBytes32String("wrong data");
                await expect(Merchandise.connect(buyer)
                    .verify(wrongHash))
                    .to.emit(Merchandise, "Verify")
                    .withArgs(iotOwner.address, buyer.address, false);
            });

            it("Buyer can confirm data", async () => {
                const wrongHash = ethers.encodeBytes32String("test");
                await expect(Merchandise.connect(buyer)
                    .verify(wrongHash))
                    .to.emit(Merchandise, "Verify")
                    .withArgs(iotOwner.address, buyer.address, true)
            });
        });

        describe("After verify", () => {
            it("Merchandise state is changed to SALE", async () => {
                const response = await Merchandise.getState()
                assert.equal(response, MerchandiseState.SALE);
            })

            it("Failed if someone without iotOwner try to withdraw", async () => {
                await expect(Merchandise.connect(buyer).withdraw())
                    .to.be.revertedWithCustomError(Merchandise, "Merchandise__NotOwner");
            })

            it("IotOwner can withdraw money from Merchandise", async () => {
                const iotOwnerBeforeBalance = await ethers.provider.getBalance(iotOwner);
                const merchandiseBeforeBalance = await ethers.provider.getBalance(Merchandise);
                const response = await Merchandise.connect(iotOwner).withdraw();

                const receipt = await response.wait();
                const gasUsed = receipt?.gasPrice! * receipt?.gasUsed!;

                const iotOwnerAfterBalance = await ethers.provider.getBalance(iotOwner);
                const merchandiseAfterBalance = await ethers.provider.getBalance(Merchandise);

                assert.equal(merchandiseAfterBalance, 0n);
                assert.equal(iotOwnerAfterBalance + gasUsed, iotOwnerBeforeBalance + merchandiseBeforeBalance);
            })
        })

    });