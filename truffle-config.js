require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider-privkey');
const privateKeys = process.env.PRIVATE_KEYS || "";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    kovan: {
      provider: function () {
        return new HDWalletProvider(
          privateKeys.split(','), //arr of account private keys
          `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`, //url to an ethereum node
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 42,
    }
  },
  plugins: ['solidity-coverage'],
  contracts_directory: './src/contracts',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: '0.6.3',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
