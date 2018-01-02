pragma solidity ^0.4.11;


import '../../contracts/crowdsale/FinalizableCrowdsale.sol';


contract FinalizableCrowdsaleImpl is FinalizableCrowdsale {

  function FinalizableCrowdsaleImpl (uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet, uint256 _tokenCap) public
    Crowdsale(_startTime, _endTime, _rate, _tokenAddr, _wallet)
    TokenCappedCrowdsale(_tokenCap)
    FinalizableCrowdsale()
  {
  }

}
