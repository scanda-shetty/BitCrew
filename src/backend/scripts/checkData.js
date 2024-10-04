const { ethers } = require("hardhat");
const contractData = require("../../frontend/contractsData/DynamicRoyalties.json"); // Import the ABI JSON
const contractABI = contractData.abi; 

async function main() {
  // Define contract address and ABI
  const contractAddress = "0xE9061F92bA9A3D9ef3f4eb8456ac9E552B3Ff5C8";

  // Get the deployer address (ensure you are using the correct signer for testing)
  const [deployer] = await ethers.getSigners();

  // Create contract instance with the deployer as the signer
  const contract = new ethers.Contract(contractAddress, contractABI, deployer);

  // Fetch song details based on songId
  const songId = 1; // Replace with the song ID you want to test
  const song = await contract.songs(songId);

  // Extract individual properties from the song object
  const listenCount = song.listenCount.toString();
  const totalRoyalties = ethers.utils.formatEther(song.totalRoyalties);
  const artist = song.artist;

  // Display the song details to verify correct contract data
  console.log("Song details:");
  console.log(`  Listen Count: ${listenCount}`);
  console.log(`  Total Royalties: ${totalRoyalties} ETH`);
  console.log(`  Artist Address: ${artist}`);

  // Fetch the royalty rate for the specified songId
  const royaltyRate = await contract.royaltyRates(songId);
  console.log(`Royalty rate for song ID ${songId}: ${ethers.utils.formatEther(royaltyRate)} ETH`);

  // Check the contract balance to ensure funds are available
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log(`Contract balance: ${ethers.utils.formatEther(balance)} ETH`);
  // Fetch event logs for RoyaltyRateUpdate

  // Additional checks (optional):
  // Fetch royalty rate updates (if events are emitted, you can listen to them here)
  // Check for other songIds to verify functionality across multiple songs
}

main().catch(console.error);
