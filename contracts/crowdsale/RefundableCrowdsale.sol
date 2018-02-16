pragma solidity ^0.4.18;

import './FinalizableCrowdsale.sol';
import './RefundVault.sol';

/**
 * @title RefundableCrowdsale
 * @dev Extension of Crowdsale contract that adds a funding goal, and
 * the possibility of users getting a refund if goal is not met.
 * Uses a RefundVault as the crowdsale's vault.
 */


contract RefundableCrowdsale is FinalizableCrowdsale {

    // minimum amount of funds to be raised in weis
    uint256 public goal;

    // refund vault used to hold funds while crowdsale is running
    RefundVault public vault;

    event VaultKilled();

    function RefundableCrowdsale(uint256 _goal) public {
        require(_goal > 0);
        vault = new RefundVault(wallet);
        goal = _goal;
    }

    // if crowdsale is unsuccessful, investors can claim refunds here
    function claimRefund() public {
        require(isFinalized);
        require(!goalReached());

        vault.refund(msg.sender);
    }

    function goalReached() public constant returns (bool) {
        return weiRaised >= goal;
    }

    // We're overriding the fund forwarding from Crowdsale.
    // In addition to sending the funds, we want to call
    // the RefundVault deposit function
    function forwardFunds() internal {
        vault.deposit.value(msg.value)(msg.sender);
    }

    // vault finalization task, called when owner calls finalize()
    function finalization(address _beneficiary) internal {
        if (goalReached()) {
            vault.close();
            super.finalization(_beneficiary);
        } else {
            vault.enableRefunds();
        }

    }

    function killVault(address beneficiary) public onlyOwner {
      vault.kill(beneficiary);
      VaultKilled();
    }
}
