import { deployments, ethers, network } from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { assert, expect } from "chai";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
        let fundMe: FundMe;
        let mockV3Aggregator: MockV3Aggregator;
        let deployer: HardhatEthersSigner
        let other: HardhatEthersSigner;
        beforeEach(async () => {
            [deployer, other] = await ethers.getSigners();
            const deploy = await deployments.fixture(["all"]);
            fundMe = await ethers.getContractAt("FundMe", deploy["FundMe"].address, deployer);
            mockV3Aggregator = await ethers.getContractAt("MockV3Aggregator", deploy["FundMe"].address, deployer);
        });

        describe("Deployment", () => {
            it("Should set the right owner", async () => {
                const response = await fundMe.getOwner();
                assert.equal(response, deployer.address);
            })
        });

        describe("Fund", () => {
            it("Fails if you don't send enough ETH", async () => {
                const amount = ethers.parseEther("0.001");
                await expect(fundMe.fund()).to.be.reverted;
            });
            it("updated the amount fended data structure", async () => {
                const amount = ethers.parseEther("1");
                await fundMe.connect(other).fund({ value: amount });
                const amountFunded = await fundMe.getAddressToAmountFunded(other);
                assert.equal(amountFunded, amount);
            });
            it("Add funders to array of funders", async () => {
                const amount = ethers.parseEther("1");
                await fundMe.connect(other).fund({ value: amount });
                const funders = await fundMe.getFunder(0);
                assert.equal(funders, other.address);
            });
        });

        describe("Withdraw", () => {
            beforeEach(async () => {
                await fundMe.connect(other).fund({ value: ethers.parseEther("1") });
            });
            it("Only the owner can withdraw", async () => {
                await expect(fundMe.connect(other).withdraw())
                    .to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
            });
            it("Owner can with draw the fundme balance", async () => {
                // Arrange
                const initialFundMeBalance = await ethers.provider.getBalance(fundMe);
                const initialDeployerBalance = await ethers.provider.getBalance(deployer);
                // Act
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasPrice, gasUsed } = transactionReceipt!;
                const gasCost = gasPrice * gasUsed;
                const endingFundMeBalance = await ethers.provider.getBalance(fundMe);
                const endingDeployerBalance = await ethers.provider.getBalance(deployer);
                // Assert
                assert.equal(endingFundMeBalance, 0n);
                assert.equal(
                    endingDeployerBalance + gasCost,
                    initialDeployerBalance + initialFundMeBalance
                );
            });
            it("allow us to withdraw from multiple funders", async () => {
                // Arrange
                const accounts = await ethers.getSigners();
                for (let i = 0; i < 10; i++) {
                    await fundMe.connect(accounts[i]).fund({ value: ethers.parseEther("1") });
                }
                const initialFundMeBalance = await ethers.provider.getBalance(fundMe);
                const initialDeployerBalance = await ethers.provider.getBalance(deployer);
                // Act
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasPrice, gasUsed } = transactionReceipt!;
                const gasCost = gasPrice * gasUsed;
                const endingFundMeBalance = await ethers.provider.getBalance(fundMe);
                const endingDeployerBalance = await ethers.provider.getBalance(deployer);
                // Assert
                assert.equal(endingFundMeBalance, 0n);
                assert.equal(
                    endingDeployerBalance + gasCost,
                    initialDeployerBalance + initialFundMeBalance
                );

                await expect(fundMe.getFunder(0)).to.be.reverted;
                for (let i = 0; i < 10; i++) {
                    assert.equal(
                        0n,
                        await fundMe.getAddressToAmountFunded(accounts[i])
                    );
                }
            });
            it("cheaper withdraw testing (single)", async () => {
                // Arrange
                const initialFundMeBalance = await ethers.provider.getBalance(fundMe);
                const initialDeployerBalance = await ethers.provider.getBalance(deployer);
                // Act
                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasPrice, gasUsed } = transactionReceipt!;
                const gasCost = gasPrice * gasUsed;
                const endingFundMeBalance = await ethers.provider.getBalance(fundMe);
                const endingDeployerBalance = await ethers.provider.getBalance(deployer);
                // Assert
                assert.equal(endingFundMeBalance, 0n);
                assert.equal(
                    endingDeployerBalance + gasCost,
                    initialDeployerBalance + initialFundMeBalance
                );
            });
            it("cheaper withdraw testing (multiple)", async () => {
                // Arrange
                const accounts = await ethers.getSigners();
                for (let i = 0; i < 10; i++) {
                    await fundMe.connect(accounts[i]).fund({ value: ethers.parseEther("1") });
                }
                const initialFundMeBalance = await ethers.provider.getBalance(fundMe);
                const initialDeployerBalance = await ethers.provider.getBalance(deployer);
                // Act
                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasPrice, gasUsed } = transactionReceipt!;
                const gasCost = gasPrice * gasUsed;
                const endingFundMeBalance = await ethers.provider.getBalance(fundMe);
                const endingDeployerBalance = await ethers.provider.getBalance(deployer);
                // Assert
                assert.equal(endingFundMeBalance, 0n);
                assert.equal(
                    endingDeployerBalance + gasCost,
                    initialDeployerBalance + initialFundMeBalance
                );

                await expect(fundMe.getFunder(0)).to.be.reverted;
                for (let i = 0; i < 10; i++) {
                    assert.equal(
                        0n,
                        await fundMe.getAddressToAmountFunded(accounts[i])
                    );
                }
            });
        });
    })