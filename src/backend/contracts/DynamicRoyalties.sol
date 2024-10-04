// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicRoyalties is Ownable {
    address payable public companyAddress;

    event ArtistPaid(address artist, uint256 amount);

    // Constructor to set the company address
    constructor(address payable _companyAddress) {
        companyAddress = _companyAddress;
    }

    // Function to fund the contract with ether from the company address
    function fundContract() public payable {
        require(msg.sender == companyAddress, "Only company address can fund the contract");
    }

    // Function to distribute funds to a specific artist
    function distributeRoyalties(address payable artistAddress, uint256 amount) public {
        require(address(this).balance >= amount, "Insufficient contract balance");
        artistAddress.transfer(amount);
        emit ArtistPaid(artistAddress, amount);
    }


    // Function to withdraw ether from the contract (onlyOwner)
    function withdrawFunds(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Insufficient contract balance");
        companyAddress.transfer(amount);
    }
}
