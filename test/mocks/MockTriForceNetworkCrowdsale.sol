pragma solidity ^0.4.11;

import "../../contracts/triForceNetwork/TriForceNetworkCrowdsale.sol";


/**
 * @title SampleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * HardCappedCrowdsale - sets a max boundary for raised funds
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract MockTriForceNetworkCrowdsale is TriForceNetworkCrowdsale {


  function MockTriForceNetworkCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address controller, uint256 _tokenCap, uint256 _softCap, address _whitelist)
    TriForceNetworkCrowdsale(_startTime, _endTime, _rate, _wallet, controller, _tokenCap, _softCap, _whitelist)
  {

  }

  function diluteCaps() public {
    // diluting all caps by 10^6 for testing
    goal = goal.div(1e6);
    tokenCap = tokenCap.div(1e6);

  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal constant returns (bool) {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool minPurchase = msg.value >= 1e11;
    return super.validPurchase() || (withinPeriod && minPurchase);
  }

  // diluting all rate thresholds by 10^6 for testing
  function bonusFactor() public constant returns (uint256) {
    if(now < startTime || now > endTime) return 0;

    if(totalSupply < 15000000e12) {
      return 125;
    }
    else if(totalSupply < 45000000e12) {
      return 120;
    }
    else if(totalSupply < 120000000e12) {
      return 110;
    }
    else if(totalSupply < 570000000e12) {
      return 105;
    }
    else if(totalSupply < 1170000000e12) {
      return 103;
    }
    else {
      return 100;
    }
  }
}
