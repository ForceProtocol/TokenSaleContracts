pragma solidity ^0.4.18;

import '../token/Token.sol';


/**
 Simple Token based on OpenZeppelin token contract
 */
contract Force is  Token {

    string public constant name = "Force";
    string public constant symbol = "FORCE";
    uint8 public constant decimals = 18;

}
