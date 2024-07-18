// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount;

    constructor() ERC721("DApp NFT", "DAPP"){}

    function mintMultiple(string memory _tokenURI, uint _count) external returns(uint[] memory) {
        require(_count > 0, "Count must be greater than 0");
        uint[] memory tokenIds = new uint[](_count);
        
        for (uint i = 0; i < _count; i++) {
            tokenCount++;
            _safeMint(msg.sender, tokenCount);
            _setTokenURI(tokenCount, _tokenURI);
            tokenIds[i] = tokenCount;
        }

        return tokenIds;
    }
}
