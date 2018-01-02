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


  function MockTriForceNetworkCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet, uint256 _tokenCap, uint256 _softCap, address _whitelist)
    TriForceNetworkCrowdsale(_startTime, _endTime, _rate, _tokenAddr, _wallet, _tokenCap, _softCap, _whitelist)
  {

  }

  function diluteCaps() public {
    // diluting all caps by 10^6 for testing
    goal = goal.div(1e6);
    tokenCap = tokenCap.div(1e6);
  }

  // diluting all rate thresholds by 10^6 for testing
  function bonusFactor() public constant returns (uint256) {
    if(now < startTime || now > endTime) return 0;

    if(totalSupply < 15000000e12) {
      return 25;
    }
    else if(totalSupply < 45000000e12) {
      return 20;
    }
    else if(totalSupply < 120000000e12) {
      return 10;
    }
    else if(totalSupply < 570000000e12) {
      return 5;
    }
    else if(totalSupply < 1170000000e12) {
      return 3;
    }
    else {
      return 0;
    }
  }
}
