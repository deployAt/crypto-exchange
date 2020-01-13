pragma solidity ^0.6.3;

import './lib/SafeMath.sol';
import './Token.sol';

contract Exchange {
  using SafeMath for uint256;

  address public feeAccount; // the acc that receives exchange fees
  uint256 public feePercent;
  address constant ETHER = address(0); // store ether in tokens mapping with blank address
  //storeTokens infos: tokens[tokenAddr][user1] = 10E
  //keeping tracks of all deposits
  //subsets of token.balanceOf(exchange.address)
  //AND subsets of this contract deposited Ethers
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => _Order) public orders;
  uint256 public orderCount;
  mapping(uint256 => bool) public orderCanceled;
  mapping(uint256 => bool) public orderFilled;

  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);
  event Order(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );
  event Cancel(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );
  event Trade(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    address userFill,
    uint256 timestamp
  );


  struct _Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

  constructor (address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // if ehter is sent to this contract by mistake.
  fallback() external {
    revert();
  }

  function depositEther() public payable {
    // ether deposit to this smart contract. Unique address where was deployed
    // exhange.options.address == address(this)
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint256 _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount);
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    msg.sender.transfer(_amount); // msg.sender = user1 . transfer . from address(this) = exchange
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    //exchange transfers token for the user to exchange allowance (in Token.sol)
    require(Token(_token).transferFrom(msg.sender, address(this), _amount)); //transferFrom(user1, exchange, 10)
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount); // tokens[tokenAddr][user1] = 10E
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(tokens[_token][msg.sender] >= _amount);
    tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    require(Token(_token).transfer(msg.sender, _amount)); // implied from address(This) = msg.sender in Token
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
  }

  //buy -> tokengGet = Token (filledOrder sell)
  //sell -> tokenGet = Ether (filledOrder buy)
  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount = orderCount.add(1);
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
  }

  function cancelOrder(uint256 _id) public {
    _Order storage _order = orders[_id];
    require(address(_order.user) == msg.sender);
    require(_order.id == _id); //order must exists
    orderCanceled[_id] = true;
    emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
  }

  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount);
    require(!orderFilled[_id]);
    require(!orderCanceled[_id]);
    _Order storage _order = orders[_id];
   _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
   orderFilled[_order.id] = true;

  }

  function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
    //user1 makes an order to buy 1 token (get) with 1 Ether (give)
    //user2 fills an order to sell 1 token (give) and get 1 ether (get).
    //user1 made an order -> _user
    //user2 filled an order -> msg.sender
    //fee paid by the user that fills the order (msg.sender)
    //fee deducated from _amountGet (_user)
    uint256 _feeAmount = _amountGet.mul(feePercent).div(100);

    //execute the trade
    //(tests)
    //user1 (_order.user) wants to buy 1 token for 1 ether
    //user2 (msg.sender) sells 1 token + 0.1 fee and get 1 ether
    //tokenGet = token / tokenGive = ether (in tests)
    //(no tests for inversly)
    tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
    tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);

    tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);

    tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
    tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);

    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
  }

}
