pragma solidity ^0.4.11;

import '../controller/Controller.sol';
import '../controller/add-ons/TransferLockedToken.sol';

contract MockTransferLockedTokenControl is TransferLockedToken, Controller {

  function MockTransferLockedTokenControl(address _satellite, address _dataCentreAddr)
    TransferLockedToken()
    Controller(_satellite, _dataCentreAddr)
  {

  }
}
