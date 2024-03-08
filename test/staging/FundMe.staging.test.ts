import { ethers, network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";
import assert from "assert";


developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
        let fundMe: FundMe;
        let deployer;
        const amount = ethers.parseEther("0.15");
        beforeEach(async () => {
            console.log(`working on testnet: ${network.name}`);
            [deployer] = await ethers.getSigners();
            const priceFeed = networkConfig[network.name].ethUsdPriceFeed;
            fundMe = await ethers.deployContract(
                "FundMe",
                [priceFeed],
            );
        });

        it("allows people to fund", async () => {
            await fundMe.fund({ value: amount });
            await fundMe.withdraw();
            const endingFundMeBalance = await ethers.provider.getBalance(fundMe);
            console.log(`endingFundMeBalance: ${endingFundMeBalance}`);
            assert.equal(endingFundMeBalance, 0n);
        });
    })