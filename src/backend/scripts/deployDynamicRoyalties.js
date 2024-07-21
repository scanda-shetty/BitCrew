const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const companyAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"; // Company address

    const DynamicRoyalties = await hre.ethers.getContractFactory("DynamicRoyalties");
    const dynamicRoyalties = await DynamicRoyalties.deploy(companyAddress);
    await dynamicRoyalties.deployed();

    console.log("DynamicRoyalties deployed to:", dynamicRoyalties.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
