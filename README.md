# Crypto Exchange

Decentralized exchange for trading Ethereum (ERC-20) token and ETH. 

## Demo

* https://crypto-ex.herokuapp.com (Rinkeby Testnet)

<img src="https://i.ibb.co/BZXw5Mn/Screen-Shot-2020-07-07-at-18-25-44.png" width="50%">

## Run Scripts
```json
"start": "node server.js",
"dev": "react-scripts start",
"build": "react-scripts build",
"cov": "truffle run coverage",
"test": "react-scripts test",
"eject": "react-scripts eject"
```

## Built With
* Solidity
* Truffle
* Ganache 
* Node
* Express
* React
* Redux
* Reselect
* Web3
* Bootstrap
* Apexcharts
* Heroku
* Jest

## Project Tree
```
.
├── migrations
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── public
│   └── index.html
├── scripts
│   └── seed-exchange.js
├── src
│   ├── abis
│   │   ├── Escrow.json
│   │   ├── Exchange.json
│   │   ├── InnerContract.json
│   │   ├── Library.json
│   │   ├── Migrations.json
│   │   ├── SafeMath.json
│   │   ├── TestContract.json
│   │   ├── Timelock.json
│   │   └── Token.json
│   ├── components
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── Balance.js
│   │   ├── Content.js
│   │   ├── MyTransactions.js
│   │   ├── Navbar.js
│   │   ├── NewOrder.js
│   │   ├── OrderBook.js
│   │   ├── PriceChart.config.js
│   │   ├── PriceChart.js
│   │   ├── Spinner.js
│   │   └── Trades.js
│   ├── contracts
│   │   ├── lib
│   │   │   └── SafeMath.sol
│   │   ├── Exchange.sol
│   │   ├── Migrations.sol
│   │   └── Token.sol
│   ├── store
│   │   ├── actions.js
│   │   ├── configureStore.js
│   │   ├── interactions.js
│   │   ├── reducers.js
│   │   └── selectors.js
│   ├── helpers.js
│   └── index.js
├── test
│   ├── Exchange.test.js
│   ├── helpers.js
│   └── Token.test.js
├── .babelrc
├── .eslintrc
├── .gitignore
├── .soliumrc.json
├── package.json
├── README.md
├── server.js
├── truffle-config.js
└── yarn.lock
```
