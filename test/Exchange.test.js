import { ether, tokens, ETHER_ADDRESS, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Exchange', ([deployer, feeAccount, user1]) => {
  let exchange
  let token
  const feePercent = 10

  beforeEach(async () => {
    token = await Token.new() //deploy token
    token.transfer(user1, tokens(100), { from: deployer }) // transfer some tokens to user1
    exchange = await Exchange.new(feeAccount, feePercent) // deploy exchange
  })

  describe('deployment', () => {
    it('tracks the fee account', async () => {
      const result = await exchange.feeAccount()
      result.should.equal(feeAccount) //???
    })

    it('tracks the fee percent', async () => {
      const result = await exchange.feePercent()
      result.toString().should.equal(feePercent.toString())
    })
  })

  describe('fallback', async () => {
    // doesnt work ???
    it('reverts when Ether is sent', async () => {
      await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
    })
  })


  describe('depositing Ether', async () => {
    let result
    let amount

    beforeEach(async () => {
      amount = ether(1)
      result = await exchange.depositEther({ from: user1, value: amount })
    })

    it('tracks the Ether deposit', async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1)
      balance.toString().should.equal(amount.toString())
    })

    it('emits a Deposit event', async () => {
      const log = result.logs[0]
      log.event.should.eq('Deposit')
      const event = log.args
      event.token.toString().should.eq(ETHER_ADDRESS, 'token address is correct')
      event.user.should.eq(user1, 'user address is correct')
      event.amount.toString().should.eq(amount.toString(), 'amount is correct')
      event.balance.toString().should.eq(amount.toString(), 'balance is correct')
    })

  })

  // describe('withdrawing Ether', async () => {
  //   let result

  //   beforeEach(async () => {
  //     //deposit ether first
  //     await exchange.depositEther({ from: user1, value: ether(1) })
  //   })


  //   describe('success', async () => {
  //     beforeEach(async () => {
  //       //withdraw ether
  //       result = await exchange.withdrawEther(ether(1), { from: user1 })
  //     })

  //     it('withdraws Ether funds', async () => {
  //       const balance = await exchange.tokens(ETHER_ADDRESS, user1)
  //       balance.toString().should.eq('0')
  //     })
  //   })

  //   describe('failure', async () => {

  //   })

  // })

  describe('depositing tokens', () => {
    let amount
    let result

    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(10)
        await token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositToken(token.address, amount, { from: user1 })
      })

      it('tracks the token deposit', async () => {
        let balance
        // check exchange token balance
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.eq(amount.toString())
        // check tokens on exchange
        balance = await exchange.tokens(token.address, user1)
        balance.toString().should.eq(amount.toString())
      })

      it('emits a Deposit event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Deposit')
        const event = log.args
        event.token.toString().should.eq(token.address, 'token address is correct')
        event.user.should.eq(user1, 'user address is correct')
        event.amount.toString().should.eq(amount.toString(), 'amount is correct')
        event.balance.toString().should.eq(amount.toString(), 'balance is correct')
      })
    })

    describe('failure', () => {
      it('rejects Ether deposits', async () => {
        await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
      })

      it('fails when no tokens are approved', async () => {
        // dont approve any tokens before depositing
        await exchange.depositToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })

    })


  })


})
