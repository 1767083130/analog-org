'use strict';
const BaseStrategyRunner = require('../../../lib/transferStrategys/baseStrategyRunner');
const NormalStrategyRunner = require('../../../lib/transferStrategys/normalStrategyRunner');
const testUtil = require('../../testUtil');
const co = require('co');
const assert = require('assert');

describe('差价策略基类测试. path: lib/transferStrategys/baseStrategyRunner.js', function () {
    let baseStrategyRunner,normalStrategyRunner,
        oldEnv ,strategy, realPrices,accounts;

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
        accounts = await testUtil.getTestAccount();

        done();
    });
    
    after(function(done){
        process.env.env = oldEnv;
        done();
    });

    it('getTransferStrategyLog 获取交易策略运行实例',async function (done) {
            //  *    realPrices: 市场币种价格。为空时，会自动获取当前市场的币种价格
            //  *    accounts: 账户信息。为空时会自动获取env.userName的账户信息。
            //  *              当变量是关于账户信息的，accounts、env两者不能全为空
            //  *    env,环境变量. e.g. { userName: "lcm" }

        //let transferStrategyLog = await this.getStrategyOrders(strategy);
        let env = { userName: strategy.userName };
        let envOptions = {
            realPrices: realPrices,
            accounts: accounts,
            env:env
        };

        let condition = strategy.conditions.join(' && ');
        let conditionResult = await normalStrategyRunner.getConditionResult(condition,envOptions);
        let conditionOrders = conditionResult.orders;
        assert.equal(conditionResult.fixed && conditionOrders.length > 0,true);
        
        let getLogRes = await baseStrategyRunner.getTransferStrategyLog(conditionOrders,strategy);
        assert.equal(getLogRes.isSuccess && !!getLogRes.log,true);
        assert.equal(
            getLogRes.log.operates[0].orgOperate.orderAmount <= strategy.operates[0].orderAmount && 
            getLogRes.log.operates[0].orgOperate.action == strategy.operates[0].action && 
            getLogRes.log.operates[0].orgOperate.symbol == strategy.operates[0].symbol && 
            getLogRes.log.operates[0].orgOperate.site == strategy.operates[0].site,true);
    
        done();
    });
});