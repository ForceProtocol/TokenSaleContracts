pragma solidity ^0.4.11;

import "../crowdsale/singlestage/TokenCappedCrowdsale.sol";
import "../crowdsale/RefundableCrowdsale.sol";
import "../crowdsale/singlestage/EthCappedCrowdsale.sol";
import "../crowdsale/PausableCrowdsale.sol";


/**
 * @title TriForceNetworkCrowdsale
 */
contract TriForceNetworkCrowdsale is TokenCappedCrowdsale, EthCappedCrowdsale, RefundableCrowdsale, PausableCrowdsale {


  function TriForceNetworkCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet, uint256 _tokenCap, uint256 _hardCap, uint256 _softCap)
    Crowdsale(_startTime, _endTime, _rate, _tokenAddr, _wallet)
    TokenCappedCrowdsale(_tokenCap)
    RefundableCrowdsale(_softCap)
    EthCappedCrowdsale(_hardCap)
    PausableCrowdsale()
  {

  }

  function bonusFactor() public constant returns (uint256) {
    if(now < startTime || now > endTime) return 0;

    if(totalSupply < 15000000e18) {
      return 25;
    }
    else if(totalSupply < 45000000e18) {
      return 20;
    }
    else if(totalSupply < 120000000e18) {
      return 10;
    }
    else if(totalSupply < 570000000e18) {
      return 5;
    }
    else if(totalSupply < 1170000000e18) {
      return 3;
    }
    else {
      return 0;
    }
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public whenNotPaused payable {
    uint256 tokens = _buyTokens(beneficiary, rate.add(rate.mul(bonusFactor()).div(100)));
    if(!setSupply(totalSupply.add(tokens))) revert();
  }
}
