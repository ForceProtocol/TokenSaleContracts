pragma solidity ^0.4.11;

import '../token/Token.sol';

/**
 Simple Token based on OpenZeppelin token contract
 */
contract Force is  Token {

  string public constant name = "Force";
  string public constant symbol = "TRI";
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 2500000 * (10 ** uint256(decimals));

}
