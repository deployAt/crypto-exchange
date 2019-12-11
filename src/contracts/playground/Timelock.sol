pragma solidity ^0.5.0;

contract Timelock {
  address payable public beneficiary;
  uint256 public relaseTime;

  constructor(address payable _beneficiary, uint256 _relaseTime) public payable {
    require(_relaseTime > block.timestamp);
    beneficiary = _beneficiary;
    relaseTime = _relaseTime;
  }

  function relase() public {
    require(block.timestamp >= relaseTime);
    address(beneficiary).transfer(address(this).balance);
  }
}
