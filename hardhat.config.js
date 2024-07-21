require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
const { projectId, mnemonic } = require('./sepolia-config.json');

module.exports = {
  solidity: "0.8.4",
  networks: {
    sepolia: {
      url: `https://rpc.sepolia.org`, 
      accounts: { mnemonic: mnemonic }
    },
    localhost: {
      accounts: [
        'df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e'
      ],
      url: 'http://127.0.0.1:8545'
    }
  },
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
};
