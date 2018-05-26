'use strict';

const mongoose = require('mongoose');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const BaseStrategyRunner = require('../../../lib/transferStrategys/baseStrategyRunner');
const NormalStrategyRunner = require('../../../lib/transferStrategys/normalStrategyRunner');
const Decimal = require('decimal.js');

const orderController = require('../../../lib/order');
const transferController = require('../../../lib/transferStrategys/transferController');
const testUtil = require('../../testUtil');
const co = require('co');
const assert = require('assert');

describe('差价策略基类测试. path: transferStrategys/transferController.js', function () {
    let baseStrategyRunner,normalStrategyRunner,
        oldEnv ,strategy, realPrices,accounts;
    let strategyLog;

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);
    
    before(async function (done) {
        oldEnv = process.env.env;
        process.env.env = 'development';

        baseStrategyRunner = new BaseStrategyRunner();
        normalStrategyRunner = new NormalStrategyRunner();

        let strategys = testUtil.getTestTransferStrategys();
        strategy =  strategys[0];
        realPrices = testUtil.getTestRealPrices();
        accounts = await testUtil.getTestAccount();

        done();
    });
    
    after(function(done){
        process.env.env =  oldEnv;
        done();
    });

    it('onOrderStatusChanged',async function (done) {
        let stepAmount = 1;
        let identifier;
        let options = { 
            strategy: strategy,
            realPrices: realPrices,
            accounts: accounts,
            env: { userName: strategy.userName }
        };
            
        let strategyLog = await testUtil.getTestStrategyLog(options);
        let logOperate = strategyLog.operates[0];
        let res = await orderController.runOrderOperate(logOperate,identifier,stepAmount);
        let order = res.order;

        let e = {
            order: order, //变更后的订单
            changeAmount: stepAmount //变更的额度
        };
        await transferController.onOrderStatusChanged(e);

        //检验下一步操作是否生成正确
        strategyLog = await TransferStrategyLog.load(strategyLog._id);
        assert.equal(strategyLog.operates[1].consignAmount == stepAmount,true);

        done();
    });

    it('onOrderDelayed', async function (done) {
        let stepAmount = 1;
        let identifier;
        let options = { 
            strategy: strategy,
            realPrices: realPrices,
            accounts: accounts,
            env: { userName: strategy.userName }
        };

        let strategyLog = await testUtil.getTestStrategyLog(options);
        let logOperate = strategyLog.operates[0];
        let res = await orderController.runOrderOperate(logOperate,identifier,stepAmount);
        let order = res.order;

        let e = {
            order: order, //变更后的订单
            changeAmount: stepAmount, //变更的额度
            timeDelayed: 12 * 60 * 60 * 1000
        };
        await transferController.onOrderDelayed(e);

        done();
    });

    it.skip('onTransferStatusChanged',async function (done) {
        var e = {
            order: refreshOrder,
            changeAmount: 1
        };

        let res = await transferController.onTransferStatusChanged(e);
        done();
    });
});