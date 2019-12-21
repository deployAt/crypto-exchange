import Web3 from 'web3';

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
} from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'

export const loadWeb3 = async (dispatch) => {
  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  const ethereum = window.ethereum
  ethereum.autoRefreshOnNetworkChange = false;
  const web3 = new Web3(ethereum)
  await ethereum.enable()
  dispatch(web3Loaded(web3))
  return web3
}

export const loadAccount = async (web3, dispatch) => {
  const accounts = await web3.eth.getAccounts()
  const account = accounts[0]
  dispatch(web3AccountLoaded(account))
  return account
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
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

