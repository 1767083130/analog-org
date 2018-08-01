'use strict';

const query = require('querystring');
const request = require('supertest');
const orderController = require('../../lib/order');
const testUtil = require('../testUtil');

const BaseStrategyRunner = require('../../lib/transferStrategys/baseStrategyRunner');
const NormalStrategyRunner = require('../../lib/transferStrategys/normalStrategyRunner');
const Decimal = require('decimal.js');

const assert = require('assert');
const co = require('co');

describe('支付测试. path: order.js', function () {
    let account,
        oldEnv ,strategy, realPrices;
    let strategyLog;

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(async function (done) {
        oldEnv = process.env.env;
        process.env.env = 'development';
    
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

    it('runOrderOperate 执行需要委托交易的差价策略的step', async function (done) {
        let logOperate = strategyLog.operates.find(function(value){
            return value.orgOperate.action == 'trade' && value.orgOperate.side == 'buy';
        });

        let stepAmount = 10;
        let identifier;
        let oldEthCoin = testUtil.getAccountCoin('eth',account);

        let res = await orderController.runOrderOperate(logOperate,identifier,stepAmount);
        account = await testUtil.getTestAccount();
        let newEthCoin = testUtil.getAccountCoin('eth',account);

        assert.equal(res.isSuccess,true);

        // //账户币种总额不变，冻结数增加
        // assert.equal(new Decimal(oldEthCoin.total).equals(newEthCoin.total),true); 
        // assert.equal(new Decimal(oldEthCoin.apply).plus(stepAmount).equals(newEthCoin.apply),true); 

        done();
    });

    it('cancelOrder 撤销交易委托', async function (done) {
        let logOperate = strategyLog.operates[0];
        let stepAmount = 10;
        let identifier;
        let oldEthCoin = testUtil.getAccountCoin('eth',account);

        let res = await orderController.runOrderOperate(logOperate,identifier,stepAmount);
        let newEthCoin = testUtil.getAccountCoin('eth',account);

        assert.equal(res.isSuccess,true);

        // //账户币种总额不变，冻结数不变
        // assert.equal(new Decimal(oldEthCoin.total).equals(newEthCoin.total),true); 
        // assert.equal(new Decimal(oldEthCoin.frozen).equals(newEthCoin.frozen),true); 
        done();
    });

    it('retryOrder 撤销交易委托',async function (done) {
        let options = {
            price: order.price,
            consignAmount: 0.1
        };
        let res = await orderController.retryOrder(order,options);

        assert.equal(res.isSuccess,true);
        done();
    });

    it('getMarketPrice',async function (done) {

        /**
         * 当订单需要按照市场价成交时，应当进行的委托价格
         * @param {Object} depths 
         * @param {String} operateType 
         * @param {Object} options 
         * @param {Number} [options.ignoreStepsCount] 委托价格间隔市场深度价格的层级数，默认为0
         * @param {Number} [options.ignoreAmount] 需要保证成交的订单委托数量，比如1个btc#usd，默认为0
         * @public
         */
        let depths = {
            bids: [[1,19],[0.5,20]],
            asks:[[2,8],[3,50]]
        };
        let operateType = 'buy';
        let options = {
            ignoreStepsCount: 1,
            ignoreAmount: 10
        }
        let marketPrice = orderController.getMarketPrice(depths,operateType,options)
        assert.equal(marketPrice == 3.1,true);

        done();
    });

    it('getPostOnlyPrice',async function (done) {
        /**
         * 当订单需要按照市场价成交时，应当进行的委托价格
         * @param {Object} depths 
         * @param {String} operateType 
         * @param {Object} options 
         * @param {Number} [options.ignoreStepsCount] 委托价格间隔市场深度价格的层级数，默认为0
         * @param {Number} [options.ignoreAmount] 需要保证成交的订单委托数量，比如1个btc#usd，默认为0
         * @public
         */
        let depths = {
            bids: [[1,19],[0.5,20]],
            asks:[[2,8],[3,50]]
        };
        let operateType = 'buy';
        let options = {
            ignoreStepsCount: 1,
            ignoreAmount: 10
        }
        let marketPrice = orderController.getMarketPrice(depths,operateType,options)
        assert.equal(marketPrice == 3,true);

        done();
    });
    

    // it('syncUserRecentOrders 处理一个用户的所有委托.如果在一定时间内没有成交成功的委托，尝试重新提交新的委托',async function(done){
    //     let userName = 'lcm';
    //     let sites = ['btctrade'];

    //     await orderController.syncUserRecentOrders(userName,sites,function(err,res){
    //         assert.equal(res.isSuccess,true);
    //         done();
    //     });
    // });

    // it('syncOrders 同步最近委托状态', async function (done) {
    //     await orderController.syncOrders(function(err,res){
    //         assert.equal(res.isSuccess,true);
    //         done();
    //     });
    // });

});
