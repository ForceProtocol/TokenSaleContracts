pragma solidity ^0.4.18;

import "../ownership/Ownable.sol";

/**
 * @title WhiteList
 * @dev This contract is used for storing whiteListed addresses before a crowdsale
 * is in progress. Only owner can add and remove white lists and address of this contract must be
 * set in the WhiteListedCrowdsale contract
 */


contract WhiteList is Ownable {
    mapping (address => bool) internal whiteListMap;

    event Approved(address indexed investor);
    event Disapproved(address indexed investor);

    function isWhiteListed(address investor) public constant returns (bool) {
        return whiteListMap[investor];
    }

    function addWhiteListed(address whiteListAddress) public onlyOwner {
        require(whiteListMap[whiteListAddress] == false);
        whiteListMap[whiteListAddress] = true;
        Approved(whiteListAddress);
    }

    function addWhiteListedInBulk(address[] whiteListAddress) public onlyOwner {
        for (uint i = 0; i < whiteListAddress.length; i++) {
            whiteListMap[whiteListAddress[i]] = true;
            Approved(whiteListAddress[i]);
        }
    }

    function removeWhiteListed(address whiteListAddress) public onlyOwner {
        delete whiteListMap[whiteListAddress];
        Disapproved(whiteListAddress);
    }

    function removeWhiteListedInBulk(address[] whiteListAddress) public onlyOwner {
        for (uint i = 0; i < whiteListAddress.length; i++) {
            delete whiteListMap[whiteListAddress[i]];
            Disapproved(whiteListAddress[i]);
        }
    }
}
