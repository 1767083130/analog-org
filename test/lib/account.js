'use strict';

const query = require('querystring');
const request = require('supertest');
const accountController = require('../../lib/account');
const testUtil = require('../testUtil');
const co = require('co');
const assert = require('assert');

const BaseStrategyRunner = require('../../lib/transferStrategys/baseStrategyRunner');
const NormalStrategyRunner = require('../../lib/transferStrategys/normalStrategyRunner');
const Decimal = require('decimal.js');

describe('账户测试. path: account.js', function () {
    let account,baseStrategyRunner,normalStrategyRunner,
        oldEnv ,strategy, realPrices;
    let strategyLog;


    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(async function (done) {
        oldEnv = process.env.env;
        process.env.env = 'development';
    
        baseStrategyRunner = new BaseStrategyRunner();
        normalStrategyRunner = new NormalStrategyRunner();

        let strategys = await testUtil.getTestTransferStrategys();
        strategy = strategys[0];
        realPrices = testUtil.getTestRealPrices();
        account = await testUtil.getTestAccount(true);

        //构建测试数据TransferStrategyLog
        let options = { 
            strategy: strategy,
            realPrices: realPrices,
            accounts: account,
            env: { userName: strategy.userName }
        };
        strategyLog = await testUtil.getTestStrategyLog(options);

        done();
    });
    
    after(function(done){
        process.env.env = oldEnv;
        done();
    })

    it('refreshAccountTrading 委托成交后更改账户信息', async function (done) {
        let consignAmount = 60, bargainAmount = 30, bargainChangeAmount = 20;
        let order = {
            userName: "lcm", 
            symbol: "eth#cny", //币种，如eth#btc或eth(等价于eth#cny)
            site: "btctrade", 
            price: 12,  //价格

            consignAmount: consignAmount,  //委托数量
            bargainAmount: bargainAmount, //已成交数量
            bargainChangeAmount: bargainChangeAmount, //已成交数量的变更数

            side: "buy"
        };

        //账户币种eth总额不变，申请数增加;人民币总额不变，冻结数增加
        let type = 'create'; //总共有3种：create（创建委托）,bargain（委托成交）,cancel(取消委托) 在什末情况下更新账户。
        let oldEthCoin = testUtil.getAccountCoin('eth',account);
        account = await accountController.refreshAccountTrading(order, type);  
        let newEthCoin = testUtil.getAccountCoin('eth',account); 

        assert.equal(new Decimal(oldEthCoin.total).equals(newEthCoin.total),true); 
        assert.equal(new Decimal(oldEthCoin.apply).plus(consignAmount).equals(newEthCoin.apply),true); 

        //账户币种eth总额增加，申请数减少；人民币总额减少，冻结数减少
        type = 'bargain';
        oldEthCoin = newEthCoin;
        account = await accountController.refreshAccountTrading(order, type); 
        newEthCoin = testUtil.getAccountCoin('eth',account);    

        assert.equal(new Decimal(oldEthCoin.total).plus(bargainChangeAmount).equals(newEthCoin.total),true); 
        assert.equal(new Decimal(oldEthCoin.apply).minus(bargainChangeAmount).equals(newEthCoin.apply),true); 
        
        //账户币种eth总额可能增加（当前又有部分或全部成交时），申请数减少；人民币总额增加，冻结数减少
        type = 'cancel';
        oldEthCoin = newEthCoin;
        account = await accountController.refreshAccountTrading(order, type);  
        newEthCoin = testUtil.getAccountCoin('eth',account);
    
        let cancelAmount = new Decimal(order.consignAmount).minus(order.bargainAmount).minus(order.bargainChangeAmount);
        assert.equal(new Decimal(oldEthCoin.total).plus(bargainChangeAmount).equals(newEthCoin.total),true); 
        assert.equal(new Decimal(oldEthCoin.apply).minus(bargainChangeAmount).minus(cancelAmount).equals(newEthCoin.apply),true); 

        done();
    });

    it('refreshAccountTransfering 转币后更改账户信息', async function (done) {
        let stepAmount = 10;
        let transfer = {
            source: 'btctrade', //移动路径源交易所
            target: 'btctrade', //移动路径目标交易所
            userName: 'lcm', 
            coin: 'eth', //cny、btc、ltc、usd
            consignAmount: stepAmount
        };

        //账户币种eth冻结数增加，申请数增加
        let type = 'create';//总共有3种：create（创建委托）,bargain（委托成交）,cancel(取消委托) 是否是创建委托时，更新账户。
        account = await testUtil.getTestAccount();
        let oldEthCoin = testUtil.getAccountCoin('eth',account);   

        let res = await accountController.refreshAccountTransfering(transfer, type);
        account = res.sourceAccount;
        let newEthCoin = testUtil.getAccountCoin('eth',account);  
            
        assert.equal(new Decimal(oldEthCoin.frozen).plus(stepAmount).equals(newEthCoin.frozen),true); 
        assert.equal(new Decimal(oldEthCoin.apply).plus(stepAmount).equals(newEthCoin.apply),true); 

        //账户币种eth总额不变，申请数减少，冻结数减少
        type = 'bargain';
        oldEthCoin = newEthCoin;
        res = await accountController.refreshAccountTransfering(transfer, type);
        account = res.sourceAccount;
        newEthCoin = testUtil.getAccountCoin('eth',account);  

        assert.equal(new Decimal(oldEthCoin.total).equals(newEthCoin.total),true); 
        assert.equal(new Decimal(oldEthCoin.apply).minus(stepAmount).equals(newEthCoin.apply),true); 
        assert.equal(new Decimal(oldEthCoin.frozen).minus(stepAmount).equals(newEthCoin.frozen),true); 
        
        //账户币种eth总额不变，申请数减少，冻结数减少
        type = 'cancel';
        oldEthCoin = newEthCoin;
        res = await accountController.refreshAccountTransfering(transfer, type); 
        account = res.sourceAccount; 
        newEthCoin = testUtil.getAccountCoin('eth',account);  

        assert.equal(new Decimal(oldEthCoin.total).equals(newEthCoin.total),true); 
        assert.equal(new Decimal(oldEthCoin.apply).minus(stepAmount).equals(newEthCoin.apply),true); 
        assert.equal(new Decimal(oldEthCoin.frozen).minus(stepAmount).equals(newEthCoin.frozen),true); 

        done();
    });


    it('syncAllAccounts', async function (done) {
        /**
         * 同步用户的帐户持仓情况
         *
         * @param {Function(stepRes)} stepCallback,函数传入参数如，
             stepRes = { 
                 account: account, 
                    stepIndex: index, 
                    isSuccess: true,
                    message: `第${index}个同步成功`,
                    stepCount: clientIdentifiers.length 
                };
            * @return {Account} 同步后的Account
            * @api public
            */
        await accountController.syncAllAccounts(function(stepRes){
        });
        done();
    });

})
