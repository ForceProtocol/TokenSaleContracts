pragma solidity ^0.4.18;

import '../ownership/Ownable.sol';
import './singlestage/Crowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */


contract FinalizableCrowdsale is Crowdsale, Ownable {

    bool public isFinalized;

    event Finalized();

    /**
    * @dev Must be called after crowdsale ends, to do some extra finalization
    * work. Calls the contract's finalization function.
    */
    function finalize(address _beneficiary) public onlyOwner {
        require(!isFinalized);
        require(hasEnded());

        finalization(_beneficiary);
        Finalized();

        isFinalized = true;
    }

    /**
    * @dev Can be overridden to add finalization logic. The overriding function
    * should call super.finalization() to ensure the chain of finalization is
    * executed entirely.
    */
    function finalization(address _beneficiary) internal {
        uint256 founderShares = totalSupply.div(3);
        ControllerInterface(controller).mint(_beneficiary, founderShares);
    }
}
