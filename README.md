# Decentralized Music Streaming Platform

Reference - Link of original repository is https://github.com/dappuniversity/nft_marketplace
## Technology Stack & Tools

## Setting Up
### 1. Clone/Download the Repository

### 2. Install Dependencies:
```
$ npm install
```
### 3. Create .env file
```
Format
REACT_APP_PINATA_API_KEY=""
REACT_APP_PINATA_SECRET_API_KEY=""
```
### 4. Initiate local blockchain network using hardhat
```
npx hardhat node
npx hardhat run src/backend/scripts/deploy.js --network localhost
npx hardhat run src/backend/scripts/deployDynamicRoyalties.js --network localhost
npx hardhat run src/backend/scripts/fundContract.js --network localhost
npm run start

To check smart contract status
npx hardhat run src/backend/scripts/checkData.js --network localhost





