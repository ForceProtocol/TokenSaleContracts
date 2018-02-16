pragma solidity ^0.4.18;

import './WhiteList.sol';

/**
 * @title WhiteListedCrowdsale
 * @dev Extension of Crowdsale where only White Listed addresses can
 * buy Tokens.
 */


contract WhiteListedCrowdsale {

    address public whitelistAddr;

    modifier onlyWhiteListed(address _beneficiary) {
        require(WhiteList(whitelistAddr).isWhiteListed(msg.sender) && _beneficiary == msg.sender);
        _;
    }

    function WhiteListedCrowdsale(address _whiteListAddr) public {
        whitelistAddr = _whiteListAddr;
    }
}
