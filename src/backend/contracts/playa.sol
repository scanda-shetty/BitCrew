
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicRoyaltiess is Ownable {
    struct Song {
        uint256 listenCount;
        uint256 totalRoyalties;
        address payable artist;
    }

    mapping(uint256 => Song) public songs;
    mapping(uint256 => uint256) public royaltyRates;

    address payable public companyAddress;

    event RoyaltyPaid(uint256 songId, uint256 amount, address artist);

    // Constructor to set the company address
    constructor(address payable _companyAddress) {
        companyAddress = _companyAddress;
    }

    // Function to add a new song. Any address can call this function.
    function addSong(uint256 songId, address payable artist) public {
        songs[songId] = Song(0, 0, artist);
        royaltyRates[songId] = 0.1 ether; // Initial royalty rate is 0.1 ether
    }

    // Function to get the total number of songs
    function getTotalSongs() public view returns (uint256) {
        // Assuming you have a mapping to keep track of the song IDs
        uint256 totalSongs = 0;
        // Iterate over your song IDs or keep a counter if you have one
        // Example implementation might involve storing total count in a state variable
        return totalSongs;
    }

    // Function to listen to a song and handle royalty payments
    function listen(uint256 songId) public {
        Song storage song = songs[songId];
        song.listenCount++;
        uint256 royalty = royaltyRates[songId];

        // Ensure the contract has enough ether to pay the royalty
        require(address(this).balance >= royalty, "Insufficient contract balance to pay royalty");

        song.totalRoyalties += royalty;
        song.artist.transfer(royalty);
        emit RoyaltyPaid(songId, royalty, song.artist);

        // Double the royalty rate for every 10 listens
        if (song.listenCount % 10 == 0) {
            royaltyRates[songId] *= 2;
        }
    }

    // Function to fund the contract with ether from the company address
    function fundContract() public payable {
        require(msg.sender == companyAddress, "Only company address can fund the contract");
    }

    // Function to update the royalty rate manually (if needed) - optional
    function updateRoyaltyRate(uint256 songId, uint256 newRate) public {
        require(msg.sender == companyAddress, "Only company address can update the rate");
        royaltyRates[songId] = newRate;
    }

    // Function to withdraw ether from the contract (onlyOwner) - optional
    function withdrawFunds(uint256 amount) public {
        require(msg.sender == companyAddress, "Only company address can withdraw funds");
        require(address(this).balance >= amount, "Insufficient contract balance");
        payable(companyAddress).transfer(amount);
    }
}
