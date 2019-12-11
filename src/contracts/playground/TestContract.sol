pragma solidity ^0.5.0;

import './InnerContract.sol';

contract TestContract {
  mapping(address => uint256) public balances;
  address payable public wallet;

  event Purchase(
    address indexed _buyer,
    address indexed _receiver,
    uint256 _amount
  );

  constructor(address payable _wallet) public {
    wallet = _wallet;
  }

  function buyToken() public payable {
    uint256 amount = msg.value;
    balances[msg.sender] += amount;
    wallet.transfer(msg.value);
    emit Purchase(msg.sender, wallet, amount);
  }

  function checkSender(address _innerContract) public {
    //test inner calll
    InnerContract(_innerContract).checkInnerSender(msg.sender);
  }


}

