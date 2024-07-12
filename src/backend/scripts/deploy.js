const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const NFT = await ethers.getContractFactory("NFT");
  const Marketplace = await ethers.getContractFactory("Marketplace");

  // Adjust gas limit and gas price as needed
  const gasLimit = 3000000; // Adjusted gas limit
  const gasPrice = ethers.utils.parseUnits('25', 'gwei'); // Adjusted gas price

  try {
    const marketplace = await Marketplace.deploy(1, { gasLimit, gasPrice });
    await marketplace.deployed();

    const nft = await NFT.deploy({ gasLimit, gasPrice });
    await nft.deployed();

    console.log("Marketplace address:", marketplace.address);
    console.log("NFT address:", nft.address);

    saveFrontendFiles(marketplace, "Marketplace");
    saveFrontendFiles(nft, "NFT");
  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
