pragma solidity ^0.4.11;

import '../SafeMath.sol';
import '../controller/ControllerInterface.sol';

/**
 * @title Crowdsale
 * @dev CrowdsaleBase is a base contract for managing a token crowdsale.
 * All crowdsales contracts must inherit this contract.
 */

contract CrowdsaleBase {
  using SafeMath for uint256;

  address public controller;
  uint256 public startTime;
  address public wallet;
  uint256 public weiRaised;
  uint256 public endTime;

  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function CrowdsaleBase(uint256 _startTime, address _wallet, address _controller) public {
    require(_wallet != address(0));

    controller = _controller;
    startTime = _startTime;
    wallet = _wallet;
  }

  function forwardFunds() internal;

  // @return true if the transaction can buy tokens
  function validPurchase() internal constant returns (bool) {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool minPurchase = msg.value >= 1e17;
    return withinPeriod && minPurchase;
  }

  // @return true if crowdsale event has ended
  function hasEnded() public constant returns (bool) {
    return now > endTime;
  }

  // low level token purchase function
  function _buyTokens(address beneficiary, uint256 rate) internal returns (uint256 tokens) {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    ControllerInterface(controller).mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFunds();
  }

}
