import React, { Component } from 'react';
import { connect } from 'react-redux'

import './App.css'
import {
  loadWeb3,
  loadAccount,
  loadToken,
  loadExchange,
} from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'
import Navbar from './Navbar'
import Content from './Content'

class App extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token not detected on the network')
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if (!exchange) {
      window.alert('Exchange not detected on the network')
      return
    }

    // const totalSupply = await token.methods.totalSupply().call()
  }

  render() {
    return (
      <div>
        <Navbar />
        <Content />
        { this.props.contractsLoaded ? <Content /> : <div className="content"></div>}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App)
