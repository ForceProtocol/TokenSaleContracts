const MockTriForceNetworkCrowdsale = artifacts.require('./helpers/MockTriForceNetworkCrowdsale.sol');
const Controller = artifacts.require('./triForceNetwork/TriController.sol');
const TriForceNetworkCrowdsale = artifacts.require('./triForceNetwork/TriForceNetworkCrowdsale.sol');
const Token = artifacts.require('./triForceNetwork/Force.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
const Whitelist = artifacts.require('./crowdsale/WhiteList.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = 1000000000000; // diluted ether value for testing
const PRE_SALE_DAYS = 7;
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('TriForceCrowdsale', (accounts) => {
  let multisigWallet;
  let token;
  let dataCentre;
  let whitelist;
  let startTime;
  let endTime;
  let rate;
  let softCap;
  let controller;
  let triForceCrowdsale;

  beforeEach(async () => {
    await advanceBlock();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    startTime = latestTime();
    endTime = startTime + 86400*5;
    rate = 15000;
    softCap = 1600e18;

    token = await Token.new();
    dataCentre = await DataCentre.new();
    whitelist = await Whitelist.new();
    await whitelist.addWhiteListed(accounts[4]);
    await whitelist.addWhiteListed(accounts[5]);
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    controller = await Controller.new(token.address, dataCentre.address)
    triForceCrowdsale = await MockTriForceNetworkCrowdsale.new(startTime, endTime, rate, multisigWallet.address, controller.address, softCap, whitelist.address);
    await controller.addAdmin(triForceCrowdsale.address);
    await token.transferOwnership(controller.address);
    await dataCentre.transferOwnership(controller.address);
    await controller.unpause();
    await controller.mint(accounts[0], 2500000e18);
    await triForceCrowdsale.diluteCaps();
  });

  describe('#triForceCrowdsaleDetails', () => {
    beforeEach(async () => {
      await advanceBlock();
      await controller.removeAdmin(triForceCrowdsale.address);
      triForceCrowdsale = await TriForceNetworkCrowdsale.new(startTime, endTime, rate, multisigWallet.address, controller.address, softCap, whitelist.address);
      await controller.addAdmin(triForceCrowdsale.address);
    });

    it('should allow start triForceCrowdsale properly', async () => {
    // checking startTime
    const startTimeSet = await triForceCrowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking initial token distribution details
    const initialBalance = await token.balanceOf.call(accounts[0]);
    assert.equal(2500000e18, initialBalance.toNumber(), 'initialBalance for sale NOT distributed properly');

    //checking token and wallet address
    const controllerAddress = await triForceCrowdsale.controller.call();
    const walletAddress = await triForceCrowdsale.wallet.call();
    assert.equal(controllerAddress, controller.address, 'address for token in contract not set');
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
        triForceCrowdsaleNew = await MockTriForceNetworkCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, softCap, whitelist.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(triForceCrowdsaleNew, undefined, 'triForceCrowdsale still initialized');
    });

    it('should not allow to start triForceCrowdsale due to ZERO rate',  async () => {
      let triForceCrowdsaleNew;
      try {
        triForceCrowdsaleNew = await MockTriForceNetworkCrowdsale.new(startTime, endTime, 0, token.address, multisigWallet.address, softCap, whitelist.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(triForceCrowdsaleNew, undefined, 'triForceCrowdsale still initialized');
    });

    it('should not allow to start triForceCrowdsale if cap is zero',  async () => {
      let triForceCrowdsaleNew;
      try {
        triForceCrowdsaleNew = await MockTriForceNetworkCrowdsale.new(startTime, endTime, 0, token.address, multisigWallet.address, softCap, whitelist.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(triForceCrowdsaleNew, undefined, 'triForceCrowdsale still initialized');
    });
  });


  describe('#swapRates', () => {

    it('should return bonusFactor of 125 initially', async () => {
      assert.equal((await triForceCrowdsale.inflateTotalSupply.call(0)).toNumber(), 125);
    });

    it('should return bonusFactor of 120 after sale of 15000000 tokens', async () => {
      assert.equal((await triForceCrowdsale.inflateTotalSupply.call(15000000e18)).toNumber(), 120);
    });

    it('should return bonusFactor of 110 after sale of 15000000 tokens', async () => {
      assert.equal((await triForceCrowdsale.inflateTotalSupply.call(45000000e18)).toNumber(), 110);
    });

    it('should return bonusFactor of 105 after sale of 15000000 tokens', async () => {
      assert.equal((await triForceCrowdsale.inflateTotalSupply.call(120000000e18)).toNumber(), 105);
    });

    it('should return bonusFactor of 103 after sale of 15000000 tokens', async () => {
      assert.equal((await triForceCrowdsale.inflateTotalSupply.call(570000000e18)).toNumber(), 103);
    });

    it('should return bonusFactor of 100 after sale of 15000000 tokens', async () => {
      assert.equal((await triForceCrowdsale.inflateTotalSupply.call(1170000000e18)).toNumber(), 100);
    });

 });

  describe('#purchase', () => {

    it('should not allow investors to buy tokens for less that 0.1 eth', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      try {
        await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH / 10 - 1, from: INVESTOR});
      } catch(error) {
        assertJump(error);
      }

      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      assert.equal(vaultBalance.toNumber(), 0, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
    });

    it('should not allow non-whitelisted investors to buy tokens', async () => {
      const NW_INVESTOR = accounts[6];

      // buy tokens
      try {
        await triForceCrowdsale.buyTokens(NW_INVESTOR, {value: MOCK_ONE_ETH, from: NW_INVESTOR});
      } catch(error) {
        assertJump(error);
      }

      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(NW_INVESTOR);

      assert.equal(vaultBalance.toNumber(), 0, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
    });
  
    it('should allow investors to buy tokens by sending ether to crowdsale contract', async () => {
      const INVESTOR = accounts[4];
      const totalSupplyBefore = await token.totalSupply.call();

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      await web3.eth.sendTransaction({from: INVESTOR, to: triForceCrowdsale.address, value: MOCK_ONE_ETH});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const totalSupplyAfter = await token.totalSupply.call();
      const tokensAmount = new BigNumber(2 * MOCK_ONE_ETH).mul(rate * 1.25);
      assert.equal(vaultBalance.toNumber(), 2 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
      assert.equal(totalSupplyAfter.sub(totalSupplyBefore).toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens with token bonus of 25%', async () => {
      const INVESTOR = accounts[4];
      const totalSupplyBefore = await token.totalSupply.call();

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const totalSupplyAfter = await token.totalSupply.call();
      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate * 1.25);
      assert.equal(vaultBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
      assert.equal(totalSupplyAfter.sub(totalSupplyBefore).toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens with token bonus of 20%', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      let amountEth = new BigNumber(15000000).div(rate * 1.25).toNumber();
      amountEth = amountEth * MOCK_ONE_ETH;

      await triForceCrowdsale.buyTokens(BIGBUYER, {value: amountEth, from: BIGBUYER});

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate * 1.2);
      assert.equal(vaultBalance.toNumber(), amountEth + MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens with token bonus of 10%', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      const amountEth1 = new BigNumber(15000000).div(rate * 1.25).toNumber();
      const amountEth2 = new BigNumber(30000000).div(rate * 1.2).toNumber();
      let amountEth = amountEth1 + amountEth2;
      amountEth = amountEth * MOCK_ONE_ETH;

      await triForceCrowdsale.buyTokens(BIGBUYER, {value: amountEth, from: BIGBUYER});

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate * 1.1);
      assert.equal(vaultBalance.toNumber(), amountEth + MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens with token bonus of 5%', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      const amountEth1 = new BigNumber(15000000).div(rate * 1.25).toNumber();
      const amountEth2 = new BigNumber(30000000).div(rate * 1.2).toNumber();
      const amountEth3 = new BigNumber(75000000).div(rate * 1.1).toNumber();
      let amountEth = amountEth1 + amountEth2 + amountEth3;
      amountEth = amountEth * MOCK_ONE_ETH;

      await triForceCrowdsale.buyTokens(BIGBUYER, {value: amountEth, from: BIGBUYER});
      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate * 1.05);
      assert.equal(vaultBalance.toNumber(), amountEth + MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens with token bonus of 3%', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      const amountEth1 = new BigNumber(15000000).div(rate * 1.25).toNumber();
      const amountEth2 = new BigNumber(30000000).div(rate * 1.2).toNumber();
      const amountEth3 = new BigNumber(75000000).div(rate * 1.1).toNumber();
      const amountEth4 = new BigNumber(450000000).div(rate * 1.05).toNumber();
      let amountEth = amountEth1 + amountEth2 + amountEth3 + amountEth4;
      amountEth = amountEth * MOCK_ONE_ETH;

      await triForceCrowdsale.buyTokens(BIGBUYER, {value: amountEth, from: BIGBUYER});
      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate * 1.03);
      assert.equal(vaultBalance.toNumber(), amountEth + MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at market price', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      const amountEth1 = new BigNumber(15000000).div(rate * 1.25).toNumber();
      const amountEth2 = new BigNumber(30000000).div(rate * 1.2).toNumber();
      const amountEth3 = new BigNumber(75000000).div(rate * 1.1).toNumber();
      const amountEth4 = new BigNumber(450000000).div(rate * 1.05).toNumber();
      const amountEth5 = new BigNumber(600000000).div(rate * 1.03).toNumber();

      let amountEth = amountEth1 + amountEth2 + amountEth3 + amountEth4 + amountEth5;
      amountEth = amountEth * MOCK_ONE_ETH;
      await triForceCrowdsale.buyTokens(BIGBUYER, {value: amountEth, from: BIGBUYER});

      // buy tokens
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const vaultAddr = await triForceCrowdsale.vault.call();
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate);
      assert.equal(vaultBalance.toNumber(), amountEth + MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });

  it('should allow not investors to buy tokens after endTime', async () => {
    const INVESTOR = accounts[4];
    await increaseTime(endTime - startTime + 1);
    const vaultAddr = await triForceCrowdsale.vault.call();
    // buy tokens
    try {
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
      const vaultBalance = await web3.eth.getBalance(vaultAddr);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      assert.equal(vaultBalance.toNumber(), 0, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
    }
  });

  it('should allow to buy Token when not Paused', async () => {
    const INVESTOR = accounts[4];

    const vaultAddr = await triForceCrowdsale.vault.call();
    const vaultBalanceBefore = await web3.eth.getBalance(vaultAddr);
    const tokensBalanceBefore = await token.balanceOf.call(INVESTOR);
    const tokensAmount = new BigNumber(rate * 1.25).mul(MOCK_ONE_ETH);

    await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

    const vaultBalanceAfter = await web3.eth.getBalance(vaultAddr);
    const tokensBalanceAfter = await token.balanceOf.call(INVESTOR);

    assert.equal(vaultBalanceAfter.sub(vaultBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
    assert.equal(tokensBalanceAfter.sub(tokensBalanceBefore).toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
  });


  it('should not allow to buy Token when Paused', async () => {
    await controller.pause();

    const INVESTOR = accounts[4];
    const vaultAddr = await triForceCrowdsale.vault.call();
    const vaultBalanceBefore = await web3.eth.getBalance(vaultAddr);
    const tokensBalanceBefore = await token.balanceOf.call(INVESTOR);

    try {
      await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      assert.fail('should have failed before');
    } catch (error) {
      assertJump(error);
    }

    const vaultBalanceAfter = await web3.eth.getBalance(vaultAddr);
    const tokensBalanceAfter = await token.balanceOf.call(INVESTOR);

    assert.equal(vaultBalanceAfter.sub(vaultBalanceBefore).toNumber(), 0, 'ether not deposited into the wallet');
    assert.equal(tokensBalanceAfter.sub(tokensBalanceBefore).toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
  });

  it('shound not be finalized before ending', async function () {
    try {
      await triForceCrowdsale.finalize(accounts[0]);
    } catch(error) {
      assertJump(error);
    }
  })

  it('shound not be finalized by third party after ending', async function () {
    await increaseTime(endTime - startTime + 1)
    const thirdparty = accounts[3];
    try {
      await triForceCrowdsale.finalize(accounts[0], {from: thirdparty});
    } catch(error) {
      assertJump(error);
    }
  })

  it('should enable refunds after endTime if goal not reached', async function () {
    const INVESTOR = accounts[4];
    const thirdparty = accounts[3];
    const balanceBefore = await web3.eth.getBalance(INVESTOR);
    await triForceCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR, gasPrice: 0});

    await increaseTime(endTime - startTime + 1)
    await triForceCrowdsale.finalize(accounts[0], {from: accounts[0]});

    await triForceCrowdsale.claimRefund({from: INVESTOR, gasPrice: 0});
    const balanceAfter = await web3.eth.getBalance(INVESTOR);
    assert.equal(balanceAfter.toNumber(), balanceBefore.toNumber());
  })

  it('should send founder shares during finalize after endTime if goal reached', async function () {
    const INVESTOR = accounts[4];
    const thirdparty = accounts[3];
    const balanceBefore = await token.balanceOf.call(accounts[0]);
    const amountEth = (await triForceCrowdsale.goal.call()).toNumber();

    await triForceCrowdsale.buyTokens(INVESTOR, {value: amountEth, from: INVESTOR, gasPrice: 0});

    const investorShares = amountEth * rate * 1.25;

    assert.equal(investorShares, (await triForceCrowdsale.totalSupply()).toNumber())
    const founderShares = investorShares / 3;
    await increaseTime(endTime - startTime + 1);
    await triForceCrowdsale.finalize(accounts[0], {from: accounts[0]});

    const balanceAfter = await token.balanceOf.call(accounts[0]);
    assert.equal(balanceAfter.sub(balanceBefore).toNumber(), founderShares);
  })

  it('cannot be finalized twice', async function () {
    await increaseTime(endTime - startTime + 1)
    await triForceCrowdsale.finalize(accounts[0], {from: accounts[0]})
      try {
        await triForceCrowdsale.finalize(accounts[0], {from: accounts[0]});
      } catch(error) {
        assertJump(error);
      }
    })
});
