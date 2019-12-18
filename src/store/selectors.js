import { get } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'

import { ether, tokens, GREEN, RED } from '../helpers'

const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract', false)
export const exchangeSelector = createSelector(exchange, e => e)

// const contractsLoadedSelector = state => tokenLoaded(state) && exchangeLoaded(state)
export const contractsLoadedSelector = createSelector(
  tokenLoaded,
  exchangeLoaded,
  (tl, el) => (tl && el)
)

const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
  filledOrders,
  orders => {
    //sort ASC by date for price comparison
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)
    //decorate orders
    orders = decorateFilledOrders(orders)
    //sort DESC by date for display
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)
    return orders
  })

const decorateFilledOrders = orders => {
  // tracks previous order to compare history
  let previousOrder = orders[0]
  return orders.map(order => {
    order = decorateOrder(order)
    order = decorateFilledOrder(order, previousOrder)
    previousOrder = order //update the previous order once its decorated
    return order
  })
}

const decorateOrder = order => {
  let etherAmount
  let tokenAmount

  if (order.tokenGive === "0x0000000000000000000000000000000000000000") {
    etherAmount = order.amountGive
    tokenAmount = order.amountGet
  } else {
    etherAmount = order.amountGet
    tokenAmount = order.amountGive
  }

  //calculate token price to 5 decimal places
  const precision = 100000
  let tokenPrice = (etherAmount / tokenAmount)
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return ({
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
  })
}

const decorateFilledOrder = (order, previousOrder) => {
  return ({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  //show green price if only one order exists
  if (previousOrder.id === orderId) return GREEN

  //show green price if order price higher than previous order
  //show red price if order price lower than previous order
  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN //success
  } else {
    return RED //danger
  }
}
