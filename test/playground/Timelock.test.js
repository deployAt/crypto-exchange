// import { ether } from '../helpers'

// const Timelock = artifacts.require('./playground/Timelock')

// require('chai')
//   .use(require('chai-as-promised'))
//   .should()

// contract('Timelock', ([deployer, beneficiary]) => {
//   let contract
//   let amount = ether(1)

//   beforeEach(async () => {
//     contract = await Timelock.new(beneficiary, 10, { from: deployer, value: amount })
//   })

//   describe('start', () => {

//     it('tracks the beneficiary account', async () => {
//       const result = await contract.beneficiary()
//       // result.should.equal(beneficiary)
//     })

//     it('balances before realase', async () => {
//       const t = await web3.eth.getBalance(deployer)
//       // console.log(t )

//       // const result = await contract.balance(beneficiary)
//       t.toString().should.equal()
//     })

//     // it('balances after buy', async () => {
//     //   await contract.buyToken({ from: user1, value: amount })
//     //   const result = await contract.balances(user1)
//     //   result.toString().should.equal(amount.toString())
//     // })

//   })
// })
