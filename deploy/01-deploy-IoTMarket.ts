import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { networkConfig } from "../helper-hardhat-config";

const deployIoTMarket: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { marketOwner, iotOwner, buyer } = await getNamedAccounts()
    log("Deploying IoTMarket and waiting for confirmations...")
    const iotMarket = await deploy("IoTMarket", {
        from: marketOwner,
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
    })
    log(`IoTMarket deployed at ${iotMarket.address}`)

    const chainId: number = network.config.chainId!
    if (chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
        log(`Verifying the contract on Etherscan...`)
        await hre.run("verify:verify", {
            address: iotMarket.address,
            constructorArguments: [],
        }).then(() => {
            log(`Contract verified: ${iotMarket.address}`)
        }).catch((error: Error) => {
            log(`Error while running verify:verify: ${error.message}`)
        })
    }
}
export default deployIoTMarket
deployIoTMarket.tags = ["all", "IoTMarket"]