pragma solidity ^0.5.0;

contract InnerContract {
  address public whoIsSender;
  address public whoIsPassedSender;

  function checkInnerSender(address _passedSender) public {
    whoIsSender = msg.sender; // msg.sender = TestContract.address
    whoIsPassedSender = _passedSender;
  }
}

