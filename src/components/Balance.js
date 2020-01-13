import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tabs, Tab } from 'react-bootstrap'

import {
  loadExchangeFees,
  loadBalances,
  depositEther,
  withdrawEther,
  depositToken,
  withdrawToken,
} from '../store/interactions'
import {
  web3Selector,
  exchangeSelector,
  tokenSelector,
  accountSelector,
  etherBalanceSelector,
  tokenBalanceSelector,
  exchangeEtherBalanceSelector,
  exchangeTokenBalanceSelector,
  balancesLoadingSelector,
  etherDepositAmountSelector,
  etherWithdrawAmountSelector,
  tokenDepositAmountSelector,
  tokenWithdrawAmountSelector,
} from '../store/selectors'
import {
  etherDepositAmountChanged,
  etherWithdrawAmountChanged,
  tokenDepositAmountChanged,
  tokenWithdrawAmountChanged,
} from '../store/actions'

import Spinner from './Spinner'

class Balance extends Component {
  componentWillMount() {
    this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const { dispatch, web3, exchange, token, account } = this.props
    if (web3) {
      await loadBalances(dispatch, web3, exchange, token, account)
      await loadExchangeFees(exchange, token)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.showForm) this.loadBlockchainData()
    return null
  }

  render() {
    return (
      <div className="card">
        <div className="card-header">
          Balance
        </div>
        <div className="card-body">
          {this.props.showForm ? showForm(this.props) : <Spinner />}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  const balancesLoading = balancesLoadingSelector(state)

  return {
    web3: web3Selector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    account: accountSelector(state),
    etherBalance: etherBalanceSelector(state),
    tokenBalance: tokenBalanceSelector(state),
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    balancesLoading,
    showForm: !balancesLoading,
    etherDepositAmount: etherDepositAmountSelector(state),
    etherWithdrawAmount: etherWithdrawAmountSelector(state),
    tokenDepositAmount: tokenDepositAmountSelector(state),
    tokenWithdrawAmount: tokenWithdrawAmountSelector(state),
  }
}

export default connect(mapStateToProps)(Balance)


const showForm = (props) => {
  const {
    etherBalance,
    exchangeEtherBalance,
    tokenBalance,
    exchangeTokenBalance,
    dispatch,
    etherDepositAmount,
    etherWithdrawAmount,
    tokenDepositAmount,
    tokenWithdrawAmount,
    exchange,
    token,
    account,
    web3,
  } = props

  return (
    <Tabs defaultActiveKey="deposit">
      <Tab eventKey="deposit" title="Deposit">
        <table className="table table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ETH</td>
              <td>{etherBalance}</td>
              <td>{exchangeEtherBalance}</td>
            </tr>
          </tbody>
        </table>

        <form className="row" onSubmit={event => {
          event.preventDefault()
          depositEther(dispatch, exchange, web3, etherDepositAmount, account)
        }}>
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="ETH Amount"
              onChange={e => dispatch(etherDepositAmountChanged(e.target.value))}
              className="form-control form-control-sm"
              required />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn yellow btn-block btn-sm">Deposit</button>
          </div>
        </form>
        <hr />
        <table className="table table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ZB</td>
              <td>{tokenBalance}</td>
              <td>{exchangeTokenBalance}</td>
            </tr>
          </tbody>
        </table>

        <form className="row" onSubmit={event => {
          event.preventDefault()
          depositToken(dispatch, exchange, web3, token, tokenDepositAmount, account)
        }}>
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="ZB Amount"
              onChange={e => dispatch(tokenDepositAmountChanged(e.target.value))}
              className="form-control form-control-sm"
              required />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn yellow btn-block btn-sm">Deposit</button>
          </div>
        </form>

      </Tab>
      <Tab eventKey="withdraw" title="Withdraw">
        <table className="table table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ETH</td>
              <td>{etherBalance}</td>
              <td>{exchangeEtherBalance}</td>
            </tr>
          </tbody>
        </table>

        <form className="row" onSubmit={event => {
          event.preventDefault()
          withdrawEther(dispatch, exchange, web3, etherWithdrawAmount, account)
        }}>
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="ETH Amount"
              onChange={e => dispatch(etherWithdrawAmountChanged(e.target.value))}
              className="form-control form-control-sm"
              required />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn yellow btn-block btn-sm">Withdraw</button>
          </div>
        </form>
        <hr />
        <table className="table table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ZB</td>
              <td>{tokenBalance}</td>
              <td>{exchangeTokenBalance}</td>
            </tr>
          </tbody>
        </table>

        <form className="row" onSubmit={event => {
          event.preventDefault()
          withdrawToken(dispatch, exchange, web3, token, tokenWithdrawAmount, account)
        }}>
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="ZB Amount"
              onChange={e => dispatch(tokenWithdrawAmountChanged(e.target.value))}
              className="form-control form-control-sm"
              required />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn yellow btn-block btn-sm">Withdraw</button>
          </div>
        </form>

      </Tab>
    </Tabs>
  )
}
