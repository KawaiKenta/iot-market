import { ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { assert, expect } from "chai";

const MerchandiseState = {
  SALE: 0n,
  IN_PROGRESS: 1n,
  BANNED: 2n,
};

const deployFixture = async () => {
  const [marketOwner, iotOwner, buyer] = await ethers.getSigners();
  const MerchandiseFactory = await ethers.getContractFactory(
    "Merchandise",
    iotOwner
  );
  const Merchandise = await MerchandiseFactory.deploy(
    ethers.parseEther("0.01"),
    ethers.encodeBytes32String("test")
  );
  return { marketOwner, iotOwner, buyer, Merchandise };
};

const purchaseFixture = async () => {
  const { marketOwner, iotOwner, buyer, Merchandise } = await loadFixture(
    deployFixture
  );
  await Merchandise.connect(buyer).purchase({
    value: ethers.parseEther("0.01"),
  });
  return { marketOwner, iotOwner, buyer, Merchandise };
};

const verifysuccessFixture = async () => {
  const { marketOwner, iotOwner, buyer, Merchandise } = await loadFixture(
    purchaseFixture
  );
  await Merchandise.connect(buyer).verify(ethers.encodeBytes32String("test"));
  return { marketOwner, iotOwner, buyer, Merchandise };
};

const verifyfailFixture = async () => {
  const { marketOwner, iotOwner, buyer, Merchandise } = await loadFixture(
    purchaseFixture
  );
  for (let i = 0; i < 10; i++) {
    await Merchandise.connect(buyer).verify(
      ethers.encodeBytes32String("wrong data")
    );
  }
  return { marketOwner, iotOwner, buyer, Merchandise };
};

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Merchandise", () => {
      describe("Deployment", () => {
        it("Merchandise has const Retry limit(10)", async () => {
          const { Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getRetryLimit();
          assert.equal(response, 10n);
        });

        it("Merchandise has right owner", async () => {
          const { iotOwner, Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getOwner();
          assert.equal(response, iotOwner.address);
        });

        it("Merchandise has DataHash", async () => {
          const { Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getDataHash();
          assert.equal(response, ethers.encodeBytes32String("test"));
        });

        it("Merchandise has initial price", async () => {
          const { Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getPrice();
          assert.equal(response, ethers.parseEther("0.01"));
        });

        it("Merchandise has initial state as SALE", async () => {
          const { Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getState();
          assert.equal(response, 0n);
        });

        it("Merchandise has trial count as 0", async () => {
          const { Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getTrialCount();
          assert.equal(response, 0n);
        });

        it("Merchandise has no progress buyers", async () => {
          const { Merchandise } = await loadFixture(deployFixture);
          const response = await Merchandise.getProgressBuyer();
          assert.equal(response, ethers.ZeroAddress);
        });

        it("Merchandise has no confirmed buyers", async () => {
          const { marketOwner, iotOwner, buyer, Merchandise } =
            await loadFixture(deployFixture);
          const user1 = await Merchandise.isConfirmedBuyer(buyer);
          const user2 = await Merchandise.isConfirmedBuyer(iotOwner);
          const user3 = await Merchandise.isConfirmedBuyer(marketOwner);
          for (const user of [user1, user2, user3]) {
            assert.isFalse(user);
          }
        });

        it("Failed if someone try to confirm", async () => {
          const { buyer, Merchandise } = await loadFixture(deployFixture);
          await expect(
            Merchandise.connect(buyer).verify(
              ethers.encodeBytes32String("test")
            )
          ).to.be.revertedWithCustomError(
            Merchandise,
            "Merchandise__NotInProgress"
          );
        });
      });

      describe("Purchase", () => {
        it("Fails if buyer don't send enough money", async () => {
          const { buyer, Merchandise } = await loadFixture(deployFixture);
          await Merchandise.connect(buyer);
          await expect(Merchandise.purchase()).to.be.revertedWithCustomError(
            Merchandise,
            "Merchandise__NotEnoughETH"
          );
        });

        it("Buyer can purchase merchandise", async () => {
          const { iotOwner, buyer, Merchandise } = await loadFixture(
            deployFixture
          );
          await expect(
            Merchandise.connect(buyer).purchase({
              value: ethers.parseEther("0.01"),
            })
          )
            .to.emit(Merchandise, "Purchase")
            .withArgs(iotOwner, buyer);
          const buyerAddress = await Merchandise.getProgressBuyer();
          const state = await Merchandise.getState();
          assert.equal(buyerAddress, buyer.address);
          assert.equal(state, MerchandiseState.IN_PROGRESS);
        });
      });

      describe("At state IN_PROGRESS", () => {
        it("No other user can purchase", async () => {
          const { iotOwner, Merchandise } = await loadFixture(purchaseFixture);
          await expect(
            Merchandise.connect(iotOwner).purchase({
              value: ethers.parseEther("0.01"),
            })
          ).to.be.revertedWithCustomError(
            Merchandise,
            "Merchandise__NotForSale"
          );
        });

        it("Failed if someone without buyer try to confirm", async () => {
          const { iotOwner, Merchandise } = await loadFixture(purchaseFixture);
          await expect(
            Merchandise.connect(iotOwner).verify(
              ethers.encodeBytes32String("test")
            )
          ).to.be.revertedWithCustomError(Merchandise, "Merchandise__NotBuyer");
        });

        it("Failed if buyer try to confirm with wrong data", async () => {
          const { iotOwner, buyer, Merchandise } = await loadFixture(
            purchaseFixture
          );
          const wrongHash = ethers.encodeBytes32String("wrong data");
          await expect(Merchandise.connect(buyer).verify(wrongHash))
            .to.emit(Merchandise, "Verify")
            .withArgs(iotOwner, buyer, false);
        });

        it("Buyer can confirm data", async () => {
          const { iotOwner, buyer, Merchandise } = await loadFixture(
            purchaseFixture
          );
          const wrongHash = ethers.encodeBytes32String("test");
          await expect(Merchandise.connect(buyer).verify(wrongHash))
            .to.emit(Merchandise, "Verify")
            .withArgs(iotOwner, buyer, true);
        });
      });

      describe("After verify fail", () => {
        it("Merchandise state is changed to BANNED", async () => {
          const { Merchandise } = await loadFixture(verifyfailFixture);
          const response = await Merchandise.getState();
          assert.equal(response, MerchandiseState.BANNED);
        });

        it("Failed if iotOwner try to withdraw", async () => {
          const { iotOwner, Merchandise } = await loadFixture(
            verifyfailFixture
          );
          await expect(
            Merchandise.connect(iotOwner).withdraw()
          ).to.be.revertedWithCustomError(Merchandise, "Merchandise__Bunned");
        });
      });

      describe("After verify success", () => {
        it("Merchandise state is changed to SALE", async () => {
          const { Merchandise } = await loadFixture(verifysuccessFixture);
          const response = await Merchandise.getState();
          assert.equal(response, MerchandiseState.SALE);
        });

        it("Failed if someone without iotOwner try to withdraw", async () => {
          const { buyer, Merchandise } = await loadFixture(purchaseFixture);
          await expect(
            Merchandise.connect(buyer).withdraw()
          ).to.be.revertedWithCustomError(Merchandise, "Merchandise__NotOwner");
        });

        it("IotOwner can withdraw money from Merchandise", async () => {
          const { iotOwner, Merchandise } = await loadFixture(
            verifysuccessFixture
          );
          const iotOwnerBeforeBalance = await ethers.provider.getBalance(
            iotOwner
          );
          const merchandiseBeforeBalance = await ethers.provider.getBalance(
            Merchandise
          );
          const response = await Merchandise.connect(iotOwner).withdraw();

          const receipt = await response.wait();
          const gasUsed = receipt?.gasPrice! * receipt?.gasUsed!;

          const iotOwnerAfterBalance = await ethers.provider.getBalance(
            iotOwner
          );
          const merchandiseAfterBalance = await ethers.provider.getBalance(
            Merchandise
          );

          assert.equal(merchandiseAfterBalance, 0n);
          assert.equal(
            iotOwnerAfterBalance + gasUsed,
            iotOwnerBeforeBalance + merchandiseBeforeBalance
          );
        });
      });
    });
