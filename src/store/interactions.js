import Web3 from 'web3'

import {
  web3Loaded,
  web3AccountLoaded,
  tokenLoaded,
  exchangeLoaded,
  cancelledOrdersLoaded,
  filledOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  orderFilling,
  orderFilled,
  etherBalanceLoaded,
  tokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  exchangeTokenBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade,
} from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { ETHER_ADDRESS } from '../helpers'

export const loadWeb3 = async (dispatch) => {
  if (window.ethereum) {
    // Modern dapp browsers
    window.ethereum.autoRefreshOnNetworkChange = false
    window.web3 = new Web3(window.ethereum)
    try {
      await window.ethereum.enable()
      dispatch(web3Loaded(window.web3))
      return window.web3
    } catch (err) {
      return null
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    window.web3 = new Web3(window.web3.currentProvider)
    dispatch(web3Loaded(window.web3))
    return window.web3
  } else {
    // Non-dapp browsers
    return null
  }
}

export const loadAccount = async (web3, dispatch) => {
  const accounts = await web3.eth.getAccounts()
  const account = accounts[0]
  dispatch(web3AccountLoaded(account))
  return account
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
    // unique address that contract was deployed to = Token.networks[networkId].address
    // later can use token.options.address
    const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    dispatch(tokenLoaded(token))
    return token
  } catch (error) {
    console.log('Contract not deployed to the current network')
    return null
  }
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    // unique address that contract was deployed to = Exchange.networks[networkId].address
    // later can use exchange.options.address
    const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
    dispatch(exchangeLoaded(exchange))
    return exchange
  } catch (error) {
    console.log('Contract not deployed to the current network')
    return null
  }
}

export const loadAllOrders = async (exchange, dispatch) => {
  if (exchange) {
    //fetch filled orders with the 'Cancel' event stream
    const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
    //format cancelled orders
    const cancelledOrders = cancelStream.map(event => event.returnValues)
    //add cancelled orders to the redux store
    dispatch(cancelledOrdersLoaded(cancelledOrders))

    const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
    const filledOrders = tradeStream.map(event => event.returnValues)
    dispatch(filledOrdersLoaded(filledOrders))

    const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' })
    const allOrders = orderStream.map(event => event.returnValues)
    dispatch(allOrdersLoaded(allOrders))
  }
}

export const subscribeToEvents = async (exchange, dispatch) => {
  if (exchange) {
    await exchange.events.Cancel({}, (error, event) => {
      dispatch(orderCancelled(event.returnValues))
    })
    await exchange.events.Trade({}, (error, event) => {
      dispatch(orderFilled(event.returnValues))
    })
    await exchange.events.Deposit({}, (error, event) => {
      // console.log('events.Deposit', event.returnValues)
      // to much work as do it like in order (orderMade). need to cast the returnValues and fit them
      // in the exchange props not like a all order object.
      dispatch(balancesLoaded())
    })
    await exchange.events.Withdraw({}, (error, event) => {
      dispatch(balancesLoaded())
    })
    await exchange.events.Order({}, (error, event) => {
      dispatch(orderMade(event.returnValues))
    })
  }
}

export const cancelOrder = (dispatch, exchange, order, account) => {
  exchange.methods.cancelOrder(order.id).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(orderCancelling())
    })
    .on('error', error => {
      console.log(error)
      window.alert('cancel order error')
    })
}

export const fillOrder = (dispatch, exchange, order, account) => {
  exchange.methods.fillOrder(order.id).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(orderFilling())
    })
    .on('error', error => {
      console.log(error)
      window.alert('fill order error')
    })
}

export const loadExchangeFees = async (exchange, token) => {
  // I need to change account that make a transactions
  // feeaccount = ganache 1 acc
  const feeAccount = await exchange.methods.feeAccount().call()
  const exchangeFeesEther = await exchange.methods.balanceOf(ETHER_ADDRESS, feeAccount).call()
  const exchangeFeesToken = await exchange.methods.balanceOf(token.options.address, feeAccount).call()
  // console.log(ether(exchangeFeesEther))
  // console.log(ether(exchangeFeesToken))
  // console.log(exchange.options.address)
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  //ether balance in wallet
  const etherBalance = await web3.eth.getBalance(account)
  dispatch(etherBalanceLoaded(etherBalance))

  //token balance in wallet
  const tokenBalance = await token.methods.balanceOf(account).call()
  dispatch(tokenBalanceLoaded(tokenBalance))

  //ether balance in exchange
  const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
  dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

  //token balance in exchange
  const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
  dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

  //triger all balances loaded
  dispatch(balancesLoaded())
}

export const depositEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.depositEther().send({ from: account, value: web3.utils.toWei(amount, 'ether') })
    .on('transactionHash', hash => {
      dispatch(balancesLoading())
    })
    .on('error', error => {
      console.log(error)
      window.alert('There was an error')
    })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(balancesLoading())
    })
    .on('error', error => {
      console.log(error)
      window.alert('There was an error')
    })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')

  token.methods.approve(exchange.options.address, amount).send({ from: account })
    .on('transactionHash', hash => {
      exchange.methods.depositToken(token.options.address, amount).send({ from: account })
        .on('transactionHash', hash => {
          dispatch(balancesLoading())
        })
    })
    .on('error', error => {
      console.log(error)
      window.alert('There was an error')
    })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(balancesLoading())
    })
    .on('error', error => {
      console.log(error)
      window.alert('There was an error')
    })
}

// Always buy order when giving ethers and getting tokens (shows as sell in orderBook)
export const makeBuyOrder = (dispatch, exchange, web3, token, order, account) => {
  const tokenGet = token.options.address
  const amountGet = web3.utils.toWei(order.amount, 'ether')
  const tokenGive = ETHER_ADDRESS
  const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether')

  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(buyOrderMaking())
    })
    .on('error', error => {
      console.log(error)
      window.alert('There was an error')
    })
}

// Always sell order when giving tokens and getting ethers (shows as buy in orderBook)
export const makeSellOrder = (dispatch, exchange, web3, token, order, account) => {
  const tokenGet = ETHER_ADDRESS
  const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether')
  const tokenGive = token.options.address
  const amountGive = web3.utils.toWei(order.amount, 'ether')

  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(sellOrderMaking())
    })
    .on('error', error => {
      console.log(error)
      window.alert('There was an error')
    })
}
