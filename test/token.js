const MockTriForceNetworkCrowdsale = artifacts.require('./helpers/MockTriForceNetworkCrowdsale.sol');
const Controller = artifacts.require('./controller/Controller.sol');
const Token = artifacts.require('./triForceNetwork/Force.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
const Whitelist = artifacts.require('./crowdsale/WhiteList.sol');
const ERC223Receiver = artifacts.require('./helpers/ERC223ReceiverMock.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = 1000000000000; // diluted ether value for testing
const PRE_SALE_DAYS = 7;
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('Token', (accounts) => {
  let token;
  let dataCentre;
  let controller;
  const FOUNDERS = [accounts[0], accounts[1], accounts[2]];

  beforeEach(async () => {
    await advanceBlock();
    const startTime = latestTime();
    token = await Token.new();
    dataCentre = await DataCentre.new();
    controller = await Controller.new(token.address, dataCentre.address)
    await token.transferOwnership(controller.address);
    await dataCentre.transferOwnership(controller.address);
    await controller.unpause();
    await controller.mint(accounts[0], 2500000e18);
  });

  // only needed because of the refactor
  describe('#transfer', () => {
    it('should allow investors to transfer', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
    });

    it('should not allow scammer and transfer un-owned tokens', async () => {

      const INVESTOR = accounts[0];
      const SCAMMER = accounts[4];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: SCAMMER});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens not transferred');
      }
    });

    it('should not allow transfer tokens more than balance', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      try {
        await token.transfer(INVESTOR, tokensAmount.add(10).toNumber(), {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), tokensAmount.toNumber(), 'tokens transferred');
      }
    });

    it('should not allow transfer tokens when Paused', async () => {

      await controller.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens transferred');
      }
    });

    it('should not allow minting tokens when mintingFinished', async () => {

      await controller.finishMinting();
      const BENEFICIARY = accounts[5];

      try {
        await token.mint(BENEFICIARY, MOCK_ONE_ETH * 1000);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens transferred');
      }
    });

    it('should not allow transfer tokens to self', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
    });

    it('should not allow transfer tokens to address(0)', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer('0x00', tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
    });

    it('should not allow transfer tokens to with zero amount', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(INVESTOR, 0, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
    });

    it('should allow transferring to a ERC223 Receiver contract', async () => {

      const INVESTOR = accounts[0];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      const receiver = await ERC223Receiver.new();
      const BENEFICIARY = receiver.address;


      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      const receiverCalled = await receiver.called.call();
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
      assert.equal(receiverCalled, true, 'tokens not transferred');
    });

    it('should not allow transferring to a non ERC223 contract', async () => {

      const INVESTOR = accounts[0];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      const receiver = await ERC223Receiver.new();
      const BENEFICIARY = token.address;

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens still transferred');
      }
    });

  });

  describe('#transferFrom', () => {
    it('should allow investors to approve and transferFrom', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});

      const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
      assert.equal(tokenBalanceAllowed.toNumber(), tokensAmount.toNumber(), 'tokens not allowed');

      await token.transferFrom(INVESTOR, BENEFICIARY, tokensAmount, {from: BENEFICIARY});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
    });

    it('should not allow investors to approve when Paused', async () => {

      await controller.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
        assert.equal(tokenBalanceAllowed.toNumber(), 0, 'tokens still allowed');
      }
    });

    it('should not allow investors to approve tokens to self', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error)
        const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
        assert.equal(tokenBalanceAllowed.toNumber(), 0, 'tokens still allowed');
      }
    });

    it('should not allow transferFrom tokens more than allowed', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
      assert.equal(tokenBalanceAllowed.toNumber(), tokensAmount.toNumber(), 'tokens not allowed');
      try {
        await token.transferFrom(INVESTOR, BENEFICIARY, tokensAmount + 10, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens still transferred');
      }
    });

    it('should not allow transferFrom tokens when Paused', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await controller.pause();

      try {
        await token.transferFrom(INVESTOR, BENEFICIARY, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens still transferred');
      }
    });

    it('should not allow scammers to approve un-owned tokens', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const SCAMMER = accounts[4];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: SCAMMER});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
        assert.equal(tokenBalanceAllowed.toNumber(), 0, 'tokens still transferred');
      }
    });
  });

  describe('#upgradability', () => {
    let multisigWallet;
    let token;
    let dataCentre;
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
      startTime = latestTime();
      endTime = startTime + 86400*5;
      rate = 15000;
      softCap = 1600e18;
      tokenCap = 1500000000e18;

      token = await Token.new();
      dataCentre = await DataCentre.new();
      whitelist = await Whitelist.new();
      await whitelist.addWhiteListed(accounts[4]);
      multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
      controller = await Controller.new(token.address, dataCentre.address)
      triForceCrowdsale = await MockTriForceNetworkCrowdsale.new(startTime, endTime, rate, multisigWallet.address, controller.address, tokenCap, softCap, whitelist.address);
      await controller.addAdmin(triForceCrowdsale.address);
      await token.transferOwnership(controller.address);
      await dataCentre.transferOwnership(controller.address);
      await controller.unpause();
      await controller.mint(accounts[0], 2500000e18);
    });

    it('should allow to upgrade controller contract manually', async () => {

      const swapRate = new BigNumber(rate * 1.25);
      const INVESTOR = accounts[4];
      const BENEFICIARY = accounts[5];

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');

      const dataCentreAddr = await controller.dataCentreAddr.call();
      const dataCentre = await DataCentre.at(dataCentreAddr);
      // begin the upgrade process

      const controllerNew = await Controller.new(token.address, dataCentreAddr);
      await controller.pause();

      // transfer satellite and dataCentre
      await controller.kill(controllerNew.address);

      await token.transferOwnership(controllerNew.address);
      await dataCentre.transferOwnership(controllerNew.address);

      assert.equal(await controllerNew.satellite.call(), token.address, "Token address not set in controller");
      assert.equal(await controllerNew.dataCentreAddr.call(), dataCentreAddr, "Data Centre address not set in controller");
      assert.equal(await token.owner.call(), controllerNew.address, "Token ownership not transferred to controller");
      assert.equal(await dataCentre.owner.call(), controllerNew.address, "DataCentre ownership not transferred to controller");

      await controllerNew.unpause();

      const tokensBalance1 = await token.balanceOf.call(INVESTOR);
      const tokensAmount1 = swapRate.mul(MOCK_ONE_ETH);
      assert.equal(tokensBalance1.toNumber(), tokensAmount1.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });
})
