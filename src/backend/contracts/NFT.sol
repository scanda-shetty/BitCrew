// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount;
    mapping(uint => uint256) public expirationTime;

    constructor() ERC721("DApp NFT", "DAPP"){}
    function mint(string memory _tokenURI,uint _duration) external returns(uint) {
        tokenCount ++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        expirationTime[tokenCount] = block.timestamp + _duration;
        return(tokenCount);
    }

    // Modifier to restrict access based on expiration time
    modifier onlyBeforeExpiration(uint tokenId) {
        require(block.timestamp <= expirationTime[tokenId], "NFT has expired");
        _;
    }

    // Example of a restricted action: transferring NFT only if it hasn't expired
    function transferNFT(address _to, uint tokenId) external onlyBeforeExpiration(tokenId) {
        safeTransferFrom(msg.sender, _to, tokenId);
    }
}