pragma solidity ^0.4.11;

import '../token/base/Token.sol';
import '../token/PausedToken.sol';
import '../token/TransferLockedToken.sol';


/**
 Simple Token based on OpenZeppelin token contract
 */
contract Force is TransferLockedToken, PausedToken, Token {

  string public constant name = "Force";
  string public constant symbol = "TRI";
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 2500000 * (10 ** uint256(decimals));

  function Force(address _dataCentreAddr)
    Token(_dataCentreAddr)
    TransferLockedToken()
    PausableToken()
  {

  }

}
