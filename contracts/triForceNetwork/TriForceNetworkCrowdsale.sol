pragma solidity ^0.4.11;

import "../crowdsale/RefundableCrowdsale.sol";
import "../crowdsale/WhiteListedCrowdsale.sol";


/**
 * @title TriForceNetworkCrowdsale
 */
contract TriForceNetworkCrowdsale is RefundableCrowdsale,  WhiteListedCrowdsale {

  function TriForceNetworkCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address controller, uint256 _softCap, address _whitelist)
    Crowdsale(_startTime, _endTime, _rate, _wallet, controller)
    RefundableCrowdsale(_softCap)
    WhiteListedCrowdsale(_whitelist)
  {

  }

  function bonusFactor() public constant returns (uint256) {
    if(now < startTime || now > endTime) return 0;

    if(totalSupply < 15000000e18) {
      return 125;
    }
    else if(totalSupply < 45000000e18) {
      return 120;
    }
    else if(totalSupply < 120000000e18) {
      return 110;
    }
    else if(totalSupply < 570000000e18) {
      return 105;
    }
    else if(totalSupply < 1170000000e18) {
      return 103;
    }
    else {
      return 100;
    }
  }

  // low level tokenAddr purchase function
  function buyTokens(address beneficiary) public onlyWhiteListed(beneficiary) payable {
    uint256 tokens = _buyTokens(beneficiary, rate.div(100).mul(bonusFactor()));
    totalSupply = totalSupply.add(tokens);
  }

  // fallback function can be used to buy tokens
  function () external payable {
    buyTokens(msg.sender);
  }
}
