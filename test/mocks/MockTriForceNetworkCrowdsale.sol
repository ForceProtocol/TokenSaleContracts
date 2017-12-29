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


  function MockTriForceNetworkCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet, uint256 _tokenCap, uint256 _hardCap, uint256 _softCap)
    TriForceNetworkCrowdsale(_startTime, _endTime, _rate, _tokenAddr, _wallet, _tokenCap, _hardCap, _softCap)
  {

  }

  function diluteCaps() public {
    // diluting all caps by 10^6 for testing
    hardCap = hardCap.div(1e6);
    goal = goal.div(1e6);
    tokenCap = tokenCap.div(1e6);
  }
}
