var Token = artifacts.require("./contracts/token/Token.sol");
var DataCentre = artifacts.require("./contracts/token/DataCentre.sol");
var WhiteList = artifacts.require("./contracts/crowdsale/WhiteList.sol");
var MultisigWallet = artifacts.require("./contracts/multisig/MultiSigWalletWithDailyLimit.sol");
var Controller = artifacts.require("./contracts/controller/Controller.sol");
var TriForceNetworkCrowdsale = artifacts.require("./contracts/triForceNetwork/TriForceNetworkCrowdsale.sol");
var adminAddress = "0x9fd369E59A286ac28F3E976F5337147CaF88E4D4";


module.exports = function(deployer, network, accounts) {
  let token, dataCentre, whitelist, multisigWallet, controller, triForceCrowdsale;
  deployer.deploy(Token)
  .then(function() {
    return deployer.deploy(DataCentre);
  }).then(function() {
    return deployer.deploy(WhiteList);
  }).then(function() {
    return deployer.deploy(MultisigWallet, [adminAddress], 1, "1000000000000000000");
  }).then(function() {
    return Token.deployed();
  }).then(function(_token) {
    token = _token;
    return DataCentre.deployed();
  }).then(function(_dataCentre) {
    dataCentre = _dataCentre;
    return WhiteList.deployed();
  }).then(function(_whitelist) {
    whitelist = _whitelist;
    return MultisigWallet.deployed();
  }).then(function(_multisigWallet) {
    multisigWallet = _multisigWallet;
    return deployer.deploy(Controller, token.address, dataCentre.address);
  }).then(function() {
    return Controller.deployed();
  }).then(function(_controller){
    controller = _controller;
    console.log('Transfering ownership to Controller..');
    token.transferOwnership(controller.address);
    dataCentre.transferOwnership(controller.address);
    console.log('Unpausing Controller..');
    return controller.unpause();
  }).then(function(){
    return deployer.deploy(TriForceNetworkCrowdsale, 1515402441, 1525402441, 15000, multisigWallet.address, controller.address, "1600000000000000000000", whitelist.address);
  }).then(function() {
    return TriForceNetworkCrowdsale.deployed();
  }).then(function(_triForceCrowdsale) {
    triForceCrowdsale = _triForceCrowdsale;
    console.log('Adding crowdsale to controller admins..');
    controller.addAdmin(triForceCrowdsale.address);
    controller.mint(adminAddress, "2500000000000000000000000")
  });
};
