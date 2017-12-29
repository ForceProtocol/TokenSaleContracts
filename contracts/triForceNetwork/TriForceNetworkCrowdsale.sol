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

  // low level token purchase function
  function buyTokens(address beneficiary) public whenNotPaused payable {
    uint256 tokens = _buyTokens(beneficiary, rate.mul(100).add(bonusFactor()));
    if(!setSupply(totalSupply.add(tokens))) revert();
  }
}
