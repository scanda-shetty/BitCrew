const { ethers } = require("hardhat");

async function main() {
  // Define the contract address and amount to fund
  const contractAddress = "0xC469e7aE4aD962c30c7111dc580B4adbc7E914DD";
  const amount = ethers.utils.parseEther("5.0"); // 5 ethers

  // Get the deployer and company accounts
  const [deployer, company] = await ethers.getSigners();

  // Create a new instance of the contract
  const contract = await ethers.getContractAt("DynamicRoyalties", contractAddress, company);

  // Fund the contract
  const tx = await contract.fundContract({ value: amount });
  console.log(`Funding contract with ${ethers.utils.formatEther(amount)} ETH.`);
  await tx.wait();
  console.log("Funding transaction confirmed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
