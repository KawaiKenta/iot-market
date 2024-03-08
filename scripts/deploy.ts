import { ethers, run, network } from "hardhat";
import "dotenv/config";


const main = async () => {
    console.log(`deploying contract...`);
    let simpleStorage = await ethers.deployContract("SimpleStorage");
    await simpleStorage.waitForDeployment();
    console.dir(
        `SimpleStorage with ${await simpleStorage.getAddress()} deployed`
    )

    if (network.config.chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
        console.log("network is not hardhat: verify() will run");
        console.log(`wait for a moment for Etherscan gets the byte code`)
        await simpleStorage.deploymentTransaction()?.wait(5);
        await verify(await simpleStorage.getAddress(), []);
    }

    const currentValue = await simpleStorage.retrive();
    console.log(`current value is ${currentValue}`)

    const transactionResponse = await simpleStorage.store(33n);
    await transactionResponse.wait(1);
    const updatedValue = await simpleStorage.retrive();
    console.log(`updated value is ${updatedValue}`);
}

const verify = async (contractAddress: string, args: string[]) => {
    console.log("verifying...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            args: args,
        })
    } catch (e: any) {
        console.log(e);
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!");
        } else {
            console.log(e);
        }
    }
}

main().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
})