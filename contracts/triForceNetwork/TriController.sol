pragma solidity ^0.4.18;

import '../controller/Controller.sol';
import '../controller/add-ons/TransferLockedToken.sol';


contract TriController is TransferLockedToken, Controller {

    function TriController(address _satellite, address _dataCentreAddr)
        TransferLockedToken()
        Controller(_satellite, _dataCentreAddr)
    {

    }
}
