const MockTriForceNetworkCrowdsale = artifacts.require('./helpers/MockTriForceNetworkCrowdsale.sol');
const Token = artifacts.require('./helpers/MockPausedToken.sol');
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

contract('TriForceCrowdsale', (accounts) => {
  let multisigWallet;
  let controlCentre;
  let token;
  let startTime;
  let endTime;
  let rate;
  let softCap;
  let hardCap;
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
    hardCap = 4800e18;
    tokenCap = 1500000000e18;

    token = await Token.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    triForceCrowdsale = await MockTriForceNetworkCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, tokenCap, hardCap, softCap);
    await token.transferOwnership(triForceCrowdsale.address);
    await triForceCrowdsale.unpause();
    await triForceCrowdsale.diluteCaps();
  });

  describe('#triForceCrowdsaleDetails', () => {
    it('should allow start triForceCrowdsale properly', async () => {
    // checking startTime
    const startTimeSet = await triForceCrowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking initial token distribution details
    const initialBalance = await token.balanceOf.call(accounts[0]);
    assert.equal(2500000e18, initialBalance.toNumber(), 'initialBalance for sale NOT distributed properly');

    //checking token and wallet address
    const tokenAddress = await triForceCrowdsale.tokenAddr.call();
    const walletAddress = await triForceCrowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    //list rate and check
    const rate = await triForceCrowdsale.rate.call();
    const endTime = await triForceCrowdsale.endTime.call();

    assert.equal(endTime.toNumber(), endTime, 'endTime not set right');
    assert.equal(rate.toNumber(), rate, 'rate not set right');

    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start triForceCrowdsale if endTime smaller than startTime',  async () => {
      let triForceCrowdsaleNew;
      endTime = startTime - 1;
      try {
        triForceCrowdsaleNew = await Crowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(triForceCrowdsaleNew, undefined, 'triForceCrowdsale still initialized');
    });

    it('should not allow to start triForceCrowdsale due to ZERO rate',  async () => {
      let triForceCrowdsaleNew;
      try {
        triForceCrowdsaleNew = await Crowdsale.new(startTime, endTime, 0, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(triForceCrowdsaleNew, undefined, 'triForceCrowdsale still initialized');
    });

  });


  describe('#purchase', () => {
    it('should allow investors to buy tokens at the constant swapRate', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });

  it('should allow not investors to buy tokens after endTime', async () => {
    const INVESTOR = accounts[4];
    await increaseTime(endTime - startTime + 1);

    // buy tokens
    try {
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      assert.equal(walletBalance.toNumber(), 0, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
    }
  });

  describe('#triForceCrowdsaleDetails', () => {
    it('should allow start triForceCrowdsale properly', async () => {
    // checking startTimes
    const startTimeSet = await triForceCrowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking initial token distribution details
    const initialBalance = await token.balanceOf.call(accounts[0]);
    assert.equal(28350000e18, initialBalance.toNumber(), 'initialBalance for sale NOT distributed properly');

    //checking token and wallet address
    const tokenAddress = await triForceCrowdsale.tokenAddr.call();
    const walletAddress = await triForceCrowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    // list tokenCap and check
    const tokenCapSet = await triForceCrowdsale.tokenCap.call();

    assert.equal(tokenCapSet.toNumber(), tokenCap, 'tokenCap not set');
    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start triForceCrowdsale if cap is zero',  async () => {
      let triForceCrowdsaleNew;
      try {
        triForceCrowdsale = await TokenCappedCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, 0);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(triForceCrowdsaleNew, undefined, 'triForceCrowdsale still initialized');
    });
  });


  describe('#purchaseBelowCaps', () => {

    beforeEach(async () => {
      await triForceCrowdsale.diluteCaps();
    });

    it('should allow investors to buy tokens just below tokenCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((tokenCap/1e18)/rate) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await triForceCrowdsale.totalSupply.call();
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseCaps', () => {

    beforeEach(async () => {
      await triForceCrowdsale.diluteCaps();
    });

    it('should allow investors to buy tokens just equal to tokenCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((tokenCap/1e18)/rate)).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await triForceCrowdsale.totalSupply.call();
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseOverCaps', () => {

    beforeEach(async () => {
      await triForceCrowdsale.diluteCaps();
    });

    it('should not allow investors to buy tokens above tokenCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((tokenCap/1e18)/rate) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      try {
        await triForceCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await triForceCrowdsale.totalSupply.call();
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });
  });

  it('should allow to setContracts in TriForceCrowdsale manually', async () => {
    await triForceCrowdsale.pause();

    const tokenNew = await Token.new();
    const multisigNew = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    await triForceCrowdsale.setContracts(tokenNew.address, multisigNew.address);
    assert.equal(await triForceCrowdsale.tokenAddr(), tokenNew.address, 'token contract not set');
    assert.equal(await triForceCrowdsale.wallet(), multisigNew.address, 'wallet contract not set');
  });

  it('should allow to transfer Token Ownership in TriForceCrowdsale manually', async () => {
    await triForceCrowdsale.pause();

    await triForceCrowdsale.transferTokenOwnership(multisigWallet.address);
    assert.equal(await token.owner(), multisigWallet.address, 'ownership not transferred');
  });

  it('should not allow to add and remove admins', async () => {

    await triForceCrowdsale.addAdmin(accounts[2]);
    await triForceCrowdsale.addAdmin(accounts[3]);

    assert.equal(await triForceCrowdsale.admins(1), accounts[2], 'governance not added');
    assert.equal(await triForceCrowdsale.admins(2), accounts[3], 'governance not added');

    await triForceCrowdsale.removeAdmin(accounts[3]);
    await triForceCrowdsale.removeAdmin(accounts[2]);

    try {
      await triForceCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }

    try {
      await triForceCrowdsale.admins.call(2);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should allow to buy Token when not Paused', async () => {
    const INVESTOR = accounts[4];

    const walletBalanceBefore = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceBefore = await token.balanceOf.call(INVESTOR);
    const tokensAmount = new BigNumber(rate).mul(MOCK_ONE_ETH);

    await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

    const walletBalanceAfter = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceAfter = await token.balanceOf.call(INVESTOR);

    assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
    assert.equal(tokensBalanceAfter.sub(tokensBalanceBefore).toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
  });

  it('should not allow to setContracts when not paused', async () => {

    const tokenNew = await Token.new();
    const multisigNew = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);

    try {
      await triForceCrowdsale.setContracts(tokenNew.address, multisigNew.address);
      assert.fail('should have failed before');
    } catch (error) {
      assertJump(error);
    }

    assert.equal(await triForceCrowdsale.tokenAddr(), token.address, 'token contract still set');
    assert.equal(await triForceCrowdsale.wallet(), multisigWallet.address, 'wallet contract still set');
  });

  it('should not allow to transfer Token Ownership in TriForceCrowdsale manually', async () => {

    const multisigNew = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);

    try {
      await triForceCrowdsale.transferTokenOwnership(multisigNew.address);
      assert.fail('should have failed before');
    } catch (error) {
      assertJump(error);
    }

    assert.equal(await token.owner(), triForceCrowdsale.address, 'ownership still transferred');
  });

  it('should not allow to buy Token when Paused', async () => {
    await triForceCrowdsale.pause();

    const INVESTOR = accounts[4];
    const walletBalanceBefore = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceBefore = await token.balanceOf.call(INVESTOR);

    try {
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      assert.fail('should have failed before');
    } catch (error) {
      assertJump(error);
    }

    const walletBalanceAfter = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceAfter = await token.balanceOf.call(INVESTOR);

    assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether not deposited into the wallet');
    assert.equal(tokensBalanceAfter.sub(tokensBalanceBefore).toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
  });
})
