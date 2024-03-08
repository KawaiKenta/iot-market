import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { assert, expect } from "chai";
import { SimpleStorage } from "../../typechain-types";

describe("SimpleStorage", () => {
    let simpleStorage: SimpleStorage;
    beforeEach(async () => {
        simpleStorage = await hre.ethers.deployContract("SimpleStorage");
        console.dir(
            `SimpleStorage with ${await simpleStorage.getAddress()} deployed`
        );
    })

    it("Should start with a favorite number of 0", async () => {
        const currentValue = await simpleStorage.retrive();
        const expectedValue = 0n;
        assert.equal(currentValue, expectedValue)
    })

    it("Should update when we call store func", async () => {
        const expectedValue = 7n;
        const transactionResponse = await simpleStorage.store(7n);
        await transactionResponse.wait(1);
        const currentValue = await simpleStorage.retrive()
        assert.equal(expectedValue, currentValue);
    })
})

