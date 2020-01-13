pragma solidity ^0.6.3;

import './lib/SafeMath.sol';

contract Token {
  using SafeMath for uint;

  string public name = "Zbiegien Token";
  string public symbol = "ZB";
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf; //exchange -> 100E, default set to 0
  mapping(address => mapping(address => uint256)) public allowance; //allowance[user1][exchange] = 10E

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  constructor() public {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns(bool success) {
    require(balanceOf[msg.sender] >= _value);
    _transfer(msg.sender, _to, _value);
    return true;
  }

  function _transfer(address _from, address _to, uint256 _value) internal {
    require(_to != address(0));
    balanceOf[_from] = balanceOf[_from].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public returns(bool success) {
    //approve tokens, so Exchange can manage it for the user.
    // ??? Why not approve ETHER ?
    // maybe coz ethers are build in in every SC (payable)
    require(_spender != address(0));
    //should check here if approved value is less than balance -> _value =< balanceOf[msg.sender]
    //is checked later in a transferForm
    allowance[msg.sender][_spender] = _value; //allowance[user1][exchange] = 10E
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns(bool success) {
    // delegated token transfer -> from user1 to user2 by exchange
    require(_value <= balanceOf[_from]);
    require(_value <= allowance[_from][msg.sender]);
    // allowance[user1, exchange] || from exchange.depositToken() here -> msg.sender = Exchange.address
    allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
    _transfer(_from, _to, _value); //_from -> user1(from:approval), _to -> receiver , by -> exchange
    return true;
  }

}
