const { ethers } = require("hardhat");
const contractData = require("../../frontend/contractsData/DynamicRoyalties.json"); // Import the ABI JSON
const contractABI = contractData.abi; 

async function main() {
  // Define contract address and ABI
  const contractAddress = "0xC469e7aE4aD962c30c7111dc580B4adbc7E914DD";

  // Get the deployer address
  const [deployer] = await ethers.getSigners();

  // Create contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, deployer);

  // Fetch data from the contract
  const songId = 4; // Replace with the ID of the song you want to check
  const song = await contract.songs(songId);

  // Extract individual properties
  const listenCount = song.listenCount.toString();
  const totalRoyalties = ethers.utils.formatEther(song.totalRoyalties);
  const artist = song.artist;

  // Display the song details
  console.log("Song details:");
  console.log(`  Listen Count: ${listenCount}`);
  console.log(`  Total Royalties: ${totalRoyalties} ETH`);
  console.log(`  Artist Address: ${artist}`);

  const royaltyRate = await contract.royaltyRates(songId);
  console.log(`Royalty rate for song ID ${songId}: ${ethers.utils.formatEther(royaltyRate)} ETH`);

  const balance = await ethers.provider.getBalance(contractAddress);
  console.log(`Contract balance: ${ethers.utils.formatEther(balance)} ETH`);
}

main().catch(console.error);