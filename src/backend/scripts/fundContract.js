const { ethers } = require("hardhat");

async function main() {
  // Define the contract address and amount to fund
  const contractAddress = "0xE9061F92bA9A3D9ef3f4eb8456ac9E552B3Ff5C8";
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
