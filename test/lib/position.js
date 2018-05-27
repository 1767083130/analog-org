'use strict';

const query = require('querystring');
const request = require('supertest');
const position = require('../../lib/position');
const testUtil = require('../testUtil');
const co = require('co');
const assert = require('assert');
const Decimal = require('decimal.js');

describe('账户测试. path: position.js', function () {
    let account,baseStrategyRunner,normalStrategyRunner,
        oldEnv ,strategy, realPrices;
    let strategyLog;


    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        co(function *(){
        }).catch(function(e){
            done(e);
        });
    });
    
    after(function(done){
        done();
    })

    it('getAmountUsable 获取剩余可下单的金额', async function (done) {
        /**
         * 获取剩余可下单的金额。
         * 需要特别注意的是，可进行增仓仓位是动态变化的，如果进行了对仓位有影响的操作（比如下单，撤销订单等），需要再次调用此方法
         *
         * @param {String} userName 用户名
         * @param {String} site 网站名称 
         * @param {Object} options 可选参数
                 options.realPrice 市场价格，默认为当前市场价格
                    options.stepPercent 每档成交百分比，默认为STEP_PERCENT = 100
                    options.limitConfig 仓位限制
            * @return {Array} 剩余可下单的金额,如果获取异常，则返回undefined。 e.g. [{
                symbol: symbolItem.fullSymbol, 
                total: 0, 
                type: 'buy',
                available: 0  
            *  }]
            * @api public
            */
        let userName = 'lcm',
            site = 'btctrade';
        let limitConfig = {
            limits: [
                { symbol: "btc", max: 100, min: -100 },
                { symbol: "eth", max: 100, min: -100 }
            ],
            longs: [ //持有长线仓位（也可以认为是非对冲套取差价的仓位） 
                { site: "btctrade", symbol: "btc#cny", amount: 10 }  
            ]
        };
        let account = { coins: [{ coin: 'btc', total: 2 } ] }
        let options = {
            realPrice: { bids: [[],[]], asks: [[],[]] },
            stepPercent: 100,
            limitConfig: limitConfig,
            account: account,
            positions: [{ symbol: 'btc#cny',amount: 1 }]
        };

        let usableInfo = await position.getAmountUsable(userName,site,options);
        assert.equal(usableInfo.available,2);

        done();
    });


})
