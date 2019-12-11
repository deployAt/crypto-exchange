import { ether } from '../helpers'

const Escrow = artifacts.require('./playground/Escrow')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Escrow', ([agent, user1]) => {
  let contract
  let amount

  describe('start', () => {
    amount = ether(1)

    before(async () => {
      contract = await Escrow.new()
    })

    it('tracks the agent account', async () => {
      const result = await contract.agent()
      result.should.equal(agent)
    })

    it('agent deposits funds', async () => {
      //check deposit balance before
      const r1 = await contract.deposits(user1)
      r1.toString().should.equal('0')

      // deposit funds in a name of user1
      await contract.deposit(user1, { from: agent, value: amount })
      // error if deposit not agent
      await contract.deposit(user1, { from: user1 }).should.be.rejected

      //check deposit balance after
      const r2 = await contract.deposits(user1)
      r2.toString().should.equal(amount.toString())
    })

    it('agent widthdaw funds', async () => {
      //check deposit balance before
      const r1 = await contract.deposits(user1)
      r1.toString().should.equal(amount.toString())

      // withdraw funds in a name of user1
      await contract.withdraw(user1, { from: agent })
      // error if withdraw not agent
      await contract.withdraw(user1, { from: user1 }).should.be.rejected

      //check deposit balance after
      const r2 = await contract.deposits(user1)
      r2.toString().should.equal('0')

    })
  })
})
