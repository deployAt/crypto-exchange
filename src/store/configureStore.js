import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'

import rootReducer from './reducers'

const middleware = []

//dev tools
const composeEnchancers = composeWithDevTools({ trace: true, traceLimit: 25 })

export default function configureStore(preloadedState) {
  return createStore(
    rootReducer,
    preloadedState,
    composeEnchancers(applyMiddleware(...middleware))
  )
}
