import { ether } from '../helpers'

const TestContract = artifacts.require('./playground/TestContract')
const InnerContract = artifacts.require('./playground/InnerContract')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('TestContract', ([walletAcc, user1]) => {
  let contract
  let amount

  beforeEach(async () => {
    contract = await TestContract.new(walletAcc)
  })

  describe('start', () => {
    amount = ether(1)

    it('tracks the wallet account', async () => {
      const result = await contract.wallet()
      result.should.equal(walletAcc)
    })

    it('balances before buy', async () => {
      const result = await contract.balances(user1)
      result.toString().should.equal('0')
    })

    it('balances after buy', async () => {
      await contract.buyToken({ from: user1, value: amount })
      const result = await contract.balances(user1)
      result.toString().should.equal(amount.toString())
    })

    it('emits a Purchase event', async () => {
      const result = await contract.buyToken({ from: user1, value: amount })

      const log = result.logs[0]
      log.event.should.eq('Purchase')
      const event = log.args
      event._buyer.should.eq(user1, 'user1 address is correct')
      event._receiver.toString().should.eq(walletAcc, 'walletAcc address is correct')
      event._amount.toString().should.eq(amount.toString(), 'amount is correct')
    })
  })

  describe('inner functions calls', () => {

    it('check the senders', async () => {
      //https://github.com/trufflesuite/truffle/tree/master/packages/contract
      // random generated address
      // InnerContract.at(walletAcc) deosnt work ??
      const innerContract = await InnerContract.new()
      await contract.checkSender(innerContract.address);

      const contractAddress = contract.address
      const whoIsSender = await innerContract.whoIsSender()
      const whoIsPassedSender = await innerContract.whoIsPassedSender()

      contractAddress.should.equal(whoIsSender)
      walletAcc.should.equal(whoIsPassedSender)

      // If a contract's function calls
      // a function of another contract
      // within it, is the address of the contract the msg.sender?
      // - YES

      console.log('Contract address: ', contract.address)
      console.log('Innercontract address: ', innerContract.address)
      console.log('whoIsSender: ', whoIsSender)
      console.log('whoIsPassedSender: ', whoIsPassedSender)
    })

  })
})
