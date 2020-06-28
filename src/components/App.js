import React, { Component, Fragment } from 'react';
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

  state = { isError: false }

  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    if (!web3) {
      // window.alert('No network')
      this.setState({ isError: true })
      return
    }
    const networkId = await web3.eth.net.getId()
    await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    if (!token) {
      // window.alert('Token not detected on the network')
      this.setState({ isError: true })
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if (!exchange) {
      // window.alert('Exchange not detected on the network')
      this.setState({ isError: true })
      return
    }
    // const totalSupply = await token.methods.totalSupply().call()
  }

  render() {
    return (
      <Fragment>
        <Navbar />
        {this.state.isError &&
          <div className="content">
            <h3>Please connect your wallet (Metamask) and choose the "Rinkeby" test network.</h3>
          </div>}
        {this.props.contractsLoaded && <Content />}
      </Fragment>
    )
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App)
