require("@nomiclabs/hardhat-waffle");

const { projectId, mnemonic } = require('./sepolia-config.json');

module.exports = {
  solidity: "0.8.4",
  networks: {
    sepolia: {
      url: `https://rpc.sepolia.org`, 
      accounts: { mnemonic: mnemonic }
    }
  },
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
};
