pragma solidity ^0.5.0;

contract Escrow {

  address public agent; //? should be public (for test needs to be)
  mapping(address => uint256) public deposits;

  modifier onlyAgent() {
    require(msg.sender == agent);
    _;
  }

  constructor() public {
    agent = msg.sender; //address who deployed the contract
  }

  function deposit(address payee) public payable onlyAgent {
    uint256 amount = msg.value;
    deposits[payee] = deposits[payee] + amount;
  }

  function withdraw(address payable payee) public onlyAgent {
    uint256 payment = deposits[payee];
    deposits[payee] = 0;
    payee.transfer(payment);
  }
}
