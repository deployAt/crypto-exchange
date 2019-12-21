import { get, groupBy, reject, maxBy, minBy } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'

import { ether, tokens, GREEN, RED, ETHER_ADDRESS } from '../helpers'

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

//all orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
const allOrders = state => get(state, 'exchange.allOrders.data', [])

//cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

//filled orders
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

const openOrders = state => {
  const all = allOrders(state)
  const canelled = cancelledOrders(state)
  const filled = filledOrders(state)

  const openOrders = reject(all, order => {
    const orderFilled = filled.some(o => o.id === order.id)
    const orderCanceled = canelled.some(o => o.id === order.id)
    return orderFilled || orderCanceled
  })

  return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

// create the order book
export const orderBookSelector = createSelector(
  openOrders,
  orders => {
    //decorate orders
    orders = decorateOrderBookOrders(orders)
    //group order by orderType
    orders = groupBy(orders, 'orderType')
    //fetch buy orders
    const buyOrders = get(orders, 'buy', [])
    // sort buy orderd by token price
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }
    //fetch sell orders
    const sellOrders = get(orders, 'sell', [])
    // sort sell orderd by token price
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }
    return orders
  }
)

const decorateOrderBookOrders = orders => {
  return (
    orders.map(order => {
      order = decorateOrder(order)
      order = decorateOrderBookOrder(order)
      //decorate order book order
      return order
    })
  )
}

const decorateOrderBookOrder = order => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
  })
}

export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,
  (account, orders) => {
    //find our orders
    orders = orders.filter(o => o.user === account || o.userFill === account)
    //sort by date asc
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)
    //decorate add display attr
    orders = decorateMyFilledOrders(orders, account)
    return orders
  }
)

const decorateMyFilledOrders = (orders, account) => {
  return (
    orders.map(order => {
      order = decorateOrder(order)
      order = decorateMyFilledOrder(order, account)
      return order
    })
  )
}

const decorateMyFilledOrder = (order, account) => {
  const myOrder = order.user === account
  let orderType

  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
  }

  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : '-')
  })
}

export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)
export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,
  (account, orders) => {
    //filter orders created by current account
    orders = orders.filter(o => o.user === account)
    //decorate add display attr
    orders = decorateMyOpenOrders(orders)
    //sort by date desc
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)
    return orders
  }
)

const decorateMyOpenOrders = (orders, account) => {
  return (
    orders.map(order => {
      order = decorateOrder(order)
      order = decorateMyOpenOrder(order, account)
      return order
    })
  )
}

const decorateMyOpenOrder = (order, account) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
  })
}

export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const priceChartSelector = createSelector(
  filledOrders,
  orders => {
    //sort orders by date asc to compare history
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)
    //decorate orders display atrr
    orders = orders.map(o => decorateOrder(o))
    //get last 2 orders for final price and price change
    let secondLastOrder, lastOrder
    [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)
    //get last order price
    const lastPrice = get(lastOrder, 'tokenPrice', 0)
    //get second last order price
    const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

    return ({
      lastPrice,
      lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
      series: [{
        data: buildGraphData(orders)
      }]
    })
  }
)

const buildGraphData = orders => {
  //group the orders by hour for the graph
  orders = groupBy(orders, o => moment.unix(o.timestamp).startOf('hour').format())
  //get each hour where data exists
  const hours = Object.keys(orders)
  //build the graph series
  const graphData = hours.map(hour => {
    //fetch all the orders from current hour
    const group = orders[hour]
    //calculate price values - open/high/low/close
    const open = group[0] //first order
    const high = maxBy(group, 'tokenPrice')
    const low = minBy(group, 'tokenPrice')
    const close = group[group.length - 1] //last order

    return({
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice],
    })
  })
  return graphData
}


const orderCancelling = state => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)

const orderFilling = state => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector = createSelector(orderFilling, status => status)
