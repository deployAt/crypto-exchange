//truffle test
//truffle test ./test/Exchange.test.js
import { ether, tokens, ETHER_ADDRESS, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
  let exchange
  let token
  const feePercent = 10

  beforeEach(async () => {
    //deploy token
    //deployed to uniqueAddress this(address) in Token.sol
    //msg.sender in constructor is default deployer acc[0]
    token = await Token.new()
    token.transfer(user1, tokens(100), { from: deployer }) // transfer some tokens to user1
    //deploy exchange
    //deployed to uniqueAddress this(address)
    exchange = await Exchange.new(feeAccount, feePercent)
  })

  describe('deployment', () => {
    it('tracks the fee account', async () => {
      const result = await exchange.feeAccount()
      result.should.equal(feeAccount)
    })

    it('tracks the fee percent', async () => {
      const result = await exchange.feePercent()
      result.toString().should.equal(feePercent.toString())
    })
  })

  describe('fallback', async () => {
    // if ehter is sent to this contract by mistake.
    // Doesnt work in tests
    // Works in metamask (canceled TX)
    // but also works in Token address when send Ether
    // and token doesnt have fallback function
    // ???
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

  describe('withdrawing Ether', async () => {
    let result
    let amount

    beforeEach(async () => {
      //deposit ether first
      amount = ether(1)
      await exchange.depositEther({ from: user1, value: amount })
    })


    describe('success', async () => {
      beforeEach(async () => {
        //withdraw ether
        result = await exchange.withdrawEther(amount, { from: user1 })
      })

      it('withdraws Ether funds', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.eq('0')
      })

      it('emits a Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Withdraw')
        const event = log.args
        event.token.should.eq(ETHER_ADDRESS)
        event.user.should.eq(user1)
        event.amount.toString().should.eq(amount.toString())
        event.balance.toString().should.eq('0')
      })
    })

    describe('failure', async () => {
      it('rejects withdraws for insufficient balances', async () => {
        await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })

    })

  })

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

  describe('withdrawing tokens', async () => {

    describe('success', async () => {
      let result
      let amount

      beforeEach(async () => {
        //deposit token
        amount = tokens(10)
        await token.approve(exchange.address, amount, { from: user1 })
        await exchange.depositToken(token.address, amount, { from: user1 })
        //withdraw tokens
        result = await exchange.withdrawToken(token.address, amount, { from: user1 })
      })

      it('withdraws token funds', async () => {
        const balance = await exchange.tokens(token.address, user1)
        balance.toString().should.eq('0')
      })

      it('emits a "Withdraw" event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Withdraw')
        const event = log.args
        event.token.should.eq(token.address)
        event.user.should.eq(user1)
        event.amount.toString().should.eq(amount.toString())
        event.balance.toString().should.eq('0')
      })
    })

    describe('failure', async () => {
      it('rejects Ether withdraws ', async () => {
        await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })

      it('fails for inssuficient balances', async () => {
        //withoud deposit first
        await exchange.withdrawToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('checking balances', async () => {
    beforeEach(async () => {
      exchange.depositEther({ from: user1, value: ether(1) })
    })

    it('return user balance', async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
      result.toString().should.equal(ether(1).toString())
    })
  })

  describe('making orders', async () => {
    let result

    beforeEach(async () => {
      result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })

    it('tracks the newly created order', async () => {
      const orderCount = await exchange.orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1')
      order.user.should.equal(user1)
      order.tokenGet.should.equal(token.address)
      order.amountGet.toString().should.equal(tokens(1).toString())
      order.tokenGive.should.equal(ETHER_ADDRESS)
      order.amountGive.toString().should.equal(ether(1).toString())
      order.timestamp.toString().length.should.be.at.least(1)
    })

    it('emits an "Order event', async () => {
      const log = result.logs[0]
      log.event.should.eq('Order')
      const event = log.args
      event.id.toString().should.equal('1')
      event.user.should.equal(user1)
      event.tokenGet.should.equal(token.address)
      event.amountGet.toString().should.equal(tokens(1).toString())
      event.tokenGive.should.equal(ETHER_ADDRESS)
      event.amountGive.toString().should.equal(ether(1).toString())
      event.timestamp.toString().length.should.be.at.least(1)
    })
  })

  describe('order actions', async () => {
    beforeEach(async () => {
      //user1 deposits ether
      await exchange.depositEther({ from: user1, value: ether(1) })
      //give tokens to user2
      await token.transfer(user2, tokens(100), { from: deployer })
      //user2 deposists token only
      await token.approve(exchange.address, tokens(2), { from: user2 })
      await exchange.depositToken(token.address, tokens(2), { from: user2 })
      //user1 makes an order to buy 1 token (get) with 1 Ether (give)
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })

    describe('filling orders', async () => {
      let result

      describe('success', async () => {
        beforeEach(async () => {
          //user2 fills order -> charges fee to user2
          //user2 fills an order to sell 1 token and get 1 ether.
          //user2 had 2 tokens, sold 1, -0.1 token fee charge. Left 0.9 of approved tokens & 0 ether.
          result = await exchange.fillOrder('1', { from: user2 })
        })

        it('after executes the trade & charges fees', async () => {
          let balance
          balance = await exchange.balanceOf(token.address, user1)
          balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
          balance.toString().should.equal(ether(1).toString(), 'user2 received ether')
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
          balance.toString().should.equal('0', 'user1 ether deducted')
          balance = await exchange.balanceOf(token.address, user2)
          balance.toString().should.equal(tokens(0.9).toString(), 'user2 token deducted with fee aplied')
          const feeAccount = await exchange.feeAccount()
          balance = await exchange.balanceOf(token.address, feeAccount)
          balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')
        })

        it('updates filled orders', async () => {
          const orderFilled = await exchange.orderFilled(1)
          orderFilled.should.equal(true)
        })

        it('emits a "Trade event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Trade')
          const event = log.args
          event.id.toString().should.equal('1')
          event.user.should.equal(user1)
          event.tokenGet.should.equal(token.address)
          event.amountGet.toString().should.equal(tokens(1).toString())
          event.tokenGive.should.equal(ETHER_ADDRESS)
          event.amountGive.toString().should.equal(ether(1).toString())
          event.userFill.should.equal(user2)
          event.timestamp.toString().length.should.be.at.least(1)
        })
      })

      describe('failure', async () => {
        it('rejects invalid orders ids', async () => {
          const invalidOrderId = 9999
          await exchange.fillOrder(invalidOrderId, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects already-filled orders', async () => {
          //fill the order
          await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
          //try to fill it again
          await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects cancelled orders', async () => {
          //canceled the order
          await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled
          //try to fill the order
          await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })

    describe('cancelling orders', async () => {
      let result

      describe('success', async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder('1', { from: user1 })
        })

        it('updates cancelled orders', async () => {
          const orderCanceled = await exchange.orderCanceled(1)
          orderCanceled.should.equal(true)
        })

        it('emits a "Cancel" event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Cancel')
          const event = log.args
          event.id.toString().should.equal('1')
          event.user.should.equal(user1)
          event.tokenGet.should.equal(token.address)
          event.amountGet.toString().should.equal(tokens(1).toString())
          event.tokenGive.should.equal(ETHER_ADDRESS)
          event.amountGive.toString().should.equal(ether(1).toString())
          event.timestamp.toString().length.should.be.at.least(1)
        })
      })

      describe('failure', async () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderId = 9999
          await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects unauthorized cancelations', async () => {
          // try to cancel the order from another user
          await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
  })
})
