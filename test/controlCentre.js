const MockTriForceNetworkCrowdsale = artifacts.require('./helpers/MockTriForceNetworkCrowdsale.sol');
const Token = artifacts.require('./helpers/MockPausedToken.sol');
const Whitelist = artifacts.require('./crowdsale/WhiteList.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const ControlCentre = artifacts.require('./controlCentre/ControlCentre.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
const PRE_SALE_DAYS = 7;
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('ControlCentre', (accounts) => {
  let multisigWallet;
  let controlCentre;
  let token;
  let whitelist;
  let startTime;
  let endTime;
  let rate;
  let softCap;
  let tokenCap;
  let triForceCrowdsale;

  beforeEach(async () => {
    await advanceBlock();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    controlCentre = await ControlCentre.new();
    startTime = latestTime();
    endTime = startTime + 86400*5;
    rate = 15000;
    softCap = 1600e18;
    tokenCap = 1500000000e18;

    token = await Token.new();
    whitelist = await Whitelist.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    triForceCrowdsale = await MockTriForceNetworkCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, tokenCap, softCap, whitelist.address);
    await token.transferOwnership(triForceCrowdsale.address);
    await triForceCrowdsale.unpause();
    await triForceCrowdsale.diluteCaps();
  });

  it('should allow to pause MockTriForceNetworkCrowdsale using controlCentre', async () => {
    // checking cap details
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.pauseCrowdsale(triForceCrowdsale.address);
    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const stateToken = await token.paused.call();
    assert.equal(stateCrowdsale, true, 'crowdsale not paused');
    assert.equal(stateToken, true, 'token not paused');
    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should not allow Control Centre to change state if it doesnt have right', async () => {
    // checking cap details
    try {
      await controlCentre.pauseCrowdsale(triForceCrowdsale.address);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }

    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const stateToken = await token.paused.call();
    assert.equal(stateCrowdsale, false, 'crowdsale not paused');
    assert.equal(stateToken, false, 'token not paused');
  });

  it('should allow to unpause MockTriForceNetworkCrowdsale using controlCentre', async () => {
    // checking cap details
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.pauseCrowdsale(triForceCrowdsale.address);
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.unpauseCrowdsale(triForceCrowdsale.address);
    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const stateToken = await token.paused.call();
    assert.equal(stateCrowdsale, false, 'crowdsale not unpaused');
    assert.equal(stateToken, false, 'token not unpaused');
    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should allow to finish minting using controlCentre', async () => {
    // checking cap details
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.finishMinting(triForceCrowdsale.address);
    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const owner = await token.owner.call();
    const mintingStatus = await token.mintingFinished.call();
    assert.equal(stateCrowdsale, true, 'crowdsale not paused');
    assert.equal(mintingStatus, true, 'token not unpaused');
    assert.equal(owner, accounts[0], 'ownership not transferred to multisig');
    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should allow to start minting using controlCentre', async () => {
    // checking cap details
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.finishMinting(triForceCrowdsale.address);

    await token.transferOwnership(triForceCrowdsale.address);
    await triForceCrowdsale.addAdmin(controlCentre.address);

    await controlCentre.startMinting(triForceCrowdsale.address);
    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const mintingStatus = await token.mintingFinished.call();
    assert.equal(stateCrowdsale, false, 'crowdsale not unpaused');
    assert.equal(mintingStatus, false, 'token not unpaused');
    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should not allow to start minting when crowdsale not paused', async () => {
    // checking cap details
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.finishMinting(triForceCrowdsale.address);

    await token.transferOwnership(triForceCrowdsale.address);
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await triForceCrowdsale.unpause();

    try {
      await controlCentre.startMinting(triForceCrowdsale.address);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }

    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const mintingStatus = await token.mintingFinished.call();
    assert.equal(stateCrowdsale, false, 'crowdsale not unpaused');
    assert.equal(mintingStatus, true, 'minting still finished');
  });

  it('should allow to transfer DataCentre ownership of Token to FOUNDERS using controlCentre', async () => {
    // checking cap details
    await triForceCrowdsale.addAdmin(controlCentre.address);
    const dataCentreAddr = await token.dataCentreAddr.call();
    const dataCentre = DataCentre.at(dataCentreAddr);
    await controlCentre.transferDataCentreOwnership(triForceCrowdsale.address, multisigWallet.address);
    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const stateToken = await token.paused.call();
    const ownerToken = await token.owner.call();
    const ownerDataCentre = await dataCentre.owner.call()
    assert.equal(stateCrowdsale, true, 'crowdsale not paused');
    assert.equal(stateToken, true, 'token not paused');
    assert.equal(ownerToken, triForceCrowdsale.address, 'ownership not transferred');
    assert.equal(ownerDataCentre, multisigWallet.address,'ownership not transferred');
    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should allow to return DataCentre ownership of Token to token contract using controlCentre', async () => {
    // checking cap details
    const dataCentreAddr = await token.dataCentreAddr.call();
    const dataCentre = DataCentre.at(dataCentreAddr);
    await triForceCrowdsale.addAdmin(controlCentre.address);
    await controlCentre.transferDataCentreOwnership(triForceCrowdsale.address, multisigWallet.address);
    await triForceCrowdsale.addAdmin(controlCentre.address);

    var dataCentreContract = web3.eth.contract(dataCentre.abi);
    var dataCentreContractInstance = dataCentreContract.at(dataCentre.address);
    var transferOwnershipData = dataCentreContractInstance.transferOwnership.getData(controlCentre.address);

    await multisigWallet.submitTransaction(dataCentre.address, 0, transferOwnershipData, {from: accounts[1]});
    await multisigWallet.confirmTransaction(0, {from: accounts[2]});
    await multisigWallet.confirmTransaction(0, {from: accounts[3]});

    await controlCentre.returnDataCentreOwnership(triForceCrowdsale.address);
    const stateCrowdsale = await triForceCrowdsale.paused.call();
    const stateToken = await token.paused.call();
    const ownerToken = await token.owner.call();
    const ownerDataCentre = await dataCentre.owner.call()
    assert.equal(stateCrowdsale, false, 'crowdsale not unpaused');
    assert.equal(stateToken, false, 'token not unpaused');
    assert.equal(ownerToken, triForceCrowdsale.address, 'ownership not transferred');
    assert.equal(ownerDataCentre, token.address, 'ownership not transferred');
    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  // it('should allow to start another crowdsale using crowdsale after succesful completetion of the first one', async () => {
  //
  //   const amountEth = [new BigNumber(((caps[0]/1e18)/rates[0])).mul(MOCK_ONE_ETH), new BigNumber(((caps[1]/1e18)/rates[1])).mul(MOCK_ONE_ETH), new BigNumber(((caps[2]/1e18)/rates[2])).mul(MOCK_ONE_ETH), new BigNumber(((caps[3]/1e18)/rates[3])).mul(MOCK_ONE_ETH), new BigNumber(((caps[4]/1e18)/rates[4])).mul(MOCK_ONE_ETH)];
  //
  //   const INVESTORS = accounts[4];
  //   await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth[0], from: INVESTORS});
  //
  //   // forward time by 10 days
  //   await increaseTime(capTimes[0] - startTime);
  //   await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth[1], from: INVESTORS});
  //
  //   // forward time by 10 days
  //   await increaseTime(capTimes[1] - capTimes[0]);
  //   await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth[2], from: INVESTORS});
  //
  //   // forward time by 10 days
  //   await increaseTime(capTimes[2] - capTimes[1]);
  //   await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth[3], from: INVESTORS});
  //
  //   // forward time by 10 days
  //   await increaseTime(capTimes[3] - capTimes[2]);
  //   await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth[4], from: INVESTORS});
  //
  //   // check succesful completetion
  //   const totalSupply = [(await triForceCrowdsale.milestoneTotalSupply.call(0)).toNumber(), (await triForceCrowdsale.milestoneTotalSupply.call(1)).toNumber(), (await triForceCrowdsale.milestoneTotalSupply.call(2)).toNumber(), (await triForceCrowdsale.milestoneTotalSupply.call(3)).toNumber(), (await triForceCrowdsale.milestoneTotalSupply.call(4)).toNumber()];
  //   const softCap = [(await triForceCrowdsale.softCap.call(0))[1].toNumber(), (await triForceCrowdsale.softCap.call(1))[1].toNumber(), (await triForceCrowdsale.softCap.call(2))[1].toNumber(), (await triForceCrowdsale.softCap.call(3))[1].toNumber(), (await triForceCrowdsale.softCap.call(4))[1].toNumber()];
  //   const initialSupply = await token.INITIAL_SUPPLY.call();
  //   const tokenTotalSupply = await token.totalSupply.call();
  //
  //   assert.equal(totalSupply[0], softCap[0]);
  //   assert.equal(totalSupply[1], softCap[1]);
  //   assert.equal(totalSupply[2], softCap[2]);
  //   assert.equal(totalSupply[3], softCap[3]);
  //   assert.equal(totalSupply[4], softCap[4]);
  //   assert.equal(initialSupply.add(totalSupply[0]).add(totalSupply[1]).add(totalSupply[2]).add(totalSupply[3]).add(totalSupply[4]).toNumber(), tokenTotalSupply.toNumber());
  //
  //
  //   // finish the first crowdsale and transfer ownership of token to escrowCouncil
  //   await triForceCrowdsale.addAdmin(controlCentre.address);
  //   await controlCentre.finishMinting(triForceCrowdsale.address);
  //
  //   // deploy new crowdsale contract
  //   startTime = latestTime();
  //   capTimes = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
  //   ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
  //
  //   const triForceCrowdsaleNew = await MockTriForceNetworkCrowdsale.new(startTime, ends, rates, token.address, multisigWallet.address, capTimes, caps);
  //
  //   await token.transferOwnership(triForceCrowdsaleNew.address);
  //   await triForceCrowdsaleNew.addAdmin(controlCentre.address);
  //   await controlCentre.startMinting(triForceCrowdsaleNew.address);
  //
  //   // check the buy function and balance
  //   const NEW_INVESTOR = accounts[5];
  //   await triForceCrowdsaleNew.buyTokens(NEW_INVESTOR, {value: MOCK_ONE_ETH, from: INVESTORS});
  //
  //   const balance = await token.balanceOf.call(NEW_INVESTOR);
  //   assert.equal(balance.toNumber(), MOCK_ONE_ETH*rates[0]);
  // });
  //
  // it('should allow to upgrade token contract using controlCentre', async () => {
  //
  //   const swapRate = new BigNumber(rates[0]);
  //   const INVESTOR = accounts[4];
  //   const BENEFICIARY = accounts[5];
  //   // buy tokens
  //   await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
  //   const tokensBalance = await token.balanceOf.call(INVESTOR);
  //   const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
  //   assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
  //
  //   // begin the upgrade process deploy new token contract
  //   const controlCentre = await ControlCentre.new();
  //   await triForceCrowdsale.addAdmin(controlCentre.address);
  //
  //   const dataCentre = await DataCentre.at(await token.dataCentreAddr());
  //   const tokenNew = await Token.new(dataCentre.address);
  //
  //   await controlCentre.transferDataCentreOwnership(triForceCrowdsale.address, tokenNew.address);
  //   const dataCentreSet = await tokenNew.dataCentreAddr.call();
  //   assert.equal(dataCentreSet, dataCentre.address, 'dataCentre not set');
  //
  //
  //   // try a transfer operation in the new token contract
  //   await tokenNew.transfer(BENEFICIARY, tokensBalance, {from: INVESTOR});
  //   const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
  //   assert.equal(tokensBalance.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
  // });
})
