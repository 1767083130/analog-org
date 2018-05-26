'use strict';

const BetweenStrategyRunner = require('../../../lib/transferStrategys/betweenStrategyRunner');
const co = require('co');
const assert = require('assert');

describe('支付测试. path: transferStrategys/betweenStrategyRunner.js', function () {
    var betweenStrategyRunner = new BetweenStrategyRunner();

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    var strategy = {
        ignoreAmount: 15,
        minProfine: 2, //0.004,
        orderType: 0, //0为先进后出
        maxLoss: 0.04,
        turnPercent: 20,

        standPrice: 0.02,
        standAmount: 0.02
    };

    var realPrice0 = {
        bids:  [[18, 0.9], [17.9, 1], [17.8, 10], [17.7, 350], [17.6, 350]],
        asks: [[18.1, 0.9], [18.2, 1], [18.3, 10], [18.4, 350], [18.5, 350]]
    };
    var realPrice1 = {
        bids:  [ [17.7, 350], [17.6, 350]],
        asks: [ [18.4, 350], [18.5, 350]]
    };

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    });

    it.skip('getMarketConditionResult 计算条件表达式的结果(不满足条件)', function (done) {
        co(function *(){
            var res0 = betweenStrategyRunner.getMarketConditionResult(strategy, realPrice0);
            var res1 = betweenStrategyRunner.getMarketConditionResult(strategy, realPrice1);

            var logs0 = [{
                strategy: strategy,
                price: res0.price,
                amount: res0.amount,

                operates: [],
                status: 'wait' //wait,success,retry,cancel
            }];
            var watchRes0 = betweenStrategyRunner.watchLogs(logs0);
            
            var logs1 = [{
                strategy: strategy,
                price: res1.price,
                amount: res1.amount,

                operates: [],
                status: 'wait' //wait,success,retry,cancel
            }];
            var watchRes1 = betweenStrategyRunner.watchLogs(logs1);
            
            done();
        }).catch(function(e){
            done(e);
        });
    });
});