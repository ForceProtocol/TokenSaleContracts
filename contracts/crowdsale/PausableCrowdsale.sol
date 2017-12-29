pragma solidity ^0.4.11;

import '../Pausable.sol';
import './singlestage/Crowdsale.sol';

/**
 * @title PausableCrowdsale
 * @dev Extension of Crowdsale where an owner can pause the crowdsale
 * at any time.
 */
contract PausableCrowdsale is Crowdsale, Pausable {

  // Admin Functions
  function setContracts(address _tokenAddr, address _wallet) onlyAdmins whenPaused {
    wallet = _wallet;
    tokenAddr = _tokenAddr;
  }

  function transferTokenOwnership(address _nextOwner) onlyAdmins whenPaused {
    Token(tokenAddr).transferOwnership(_nextOwner);
  }
}
