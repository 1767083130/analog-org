'use strict';
const NormalStrategyRunner = require('../../../lib/transferStrategys/normalStrategyRunner');
const co = require('co');
const assert = require('assert');
const initLib = require('../../init');
const testUtil = require('../../testUtil');


describe('支付测试. path: transferStrategys/normalStrategyRunner.js', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
    });
    
    after(function(done){
        done();
    });

    it('getConditionResult 计算条件表达式的结果(不满足条件)',async function (done) {
        let realPrices = [{
            site: "chbtc", //交易网站
            symbol: "eth#cny", //币种
            bids: [[50.2,1.3],[50.09,1.54],[50,1.45],[49.98,2]], //买入委托，按照价格降序排序
            asks: [[50.58,80],[50.6,100.54],[50.89,1.45],[51,200]] //卖出委托，按照价格升序排序
        },{
            site: "btctrade", //交易网站
            symbol: "eth#cny", //币种
            bids: [[50.8,13],[50.71,1.54],[50.6,1.45],[50.4,123],[50.3,43]], //买入委托，按照价格降序排序
            asks: [[50.9,1.3],[51,154],[51.56,145.9]] //卖出委托，按照价格升序排序
        }];    

        let normalStrategyRunner = new NormalStrategyRunner();
        let envOptions = { 
            env: { userName: "lcm" }, 
            realPrices: realPrices
        };
        let res = await normalStrategyRunner.getConditionResult(
            ' (btctrade.eth.buy - chbtc.eth.sell) /  btctrade.eth.buy * 100 >= 3',
            envOptions);
        assert.equal(res.fixed, false);
        assert.equal(res.orders.length,0);
        
        done();
    });


    it('getConditionResult 计算条件表达式的结果(满足条件)', async function (done) {
        let realPrices = [{
            site: "chbtc", //交易网站
            symbol: "eth#cny", //币种
            bids: [[50.2,1.3],[50.09,1.54],[50,1.45],[49.98,2]], //买入委托，按照价格降序排序
            asks: [[50.58,80],[50.6,100.54],[50.89,1.45],[51,200]] //卖出委托，按照价格升序排序
        },{
            site: "btctrade", //交易网站
            symbol: "eth#cny", //币种
            bids: [[50.8,13],[50.71,1.54],[50.6,1.45],[50.4,123],[50.3,43]], //买入委托，按照价格降序排序
            asks: [[50.9,1.3],[51,154],[51.56,145.9]] //卖出委托，按照价格升序排序
        }];    

        let normalStrategyRunner = new NormalStrategyRunner();
        let envOptions = { 
            env: {  //如果不包含牵涉到账户信息的，env不需要传入
                userName: "lcm" 
            }, 
            realPrices: realPrices 
        };
        let res = await normalStrategyRunner.getConditionResult(
            ' (btctrade.eth.buy - chbtc.eth.sell) /  btctrade.eth.buy * 100 >= 0.4',
            envOptions);
        assert.equal(res.fixed,true);
        assert.equal(res.orders.length,2);

        let res0 = res.orders.find(function(value){
            return value.site == "btctrade";
        });
        assert.equal(res0.amount, 13);

        let res1 = res.orders.find(function(value){
            return value.site == "chbtc";
        });
        assert.equal(res1.amount, 80);
        
        done();
      
    });

    it('getConditionResult 计算条件表达式的结果(真实环境测试)', async function (done) {
        let depths = await getSymbolDepths('bitfinex');
        let realPrices = [];
        for(let item of depths.data){
            realPrices.push({
                site: item.site, //交易网站
                symbol: item.symbol, //币种
                bids: item.bids, //买入委托，按照价格降序排序
                asks: item.asks //卖出委托，按照价格升序排序
            })
        }

        let normalStrategyRunner = new NormalStrategyRunner();
        let envOptions = { 
            env: {  //如果不包含牵涉到账户信息的，env不需要传入
                userName: "lcm" 
            },
            realPrices: realPrices
        };
        let res = await normalStrategyRunner.getConditionResult(
            ' (bitfinex.eth#usd.buy - bitfinex.eth#usd.sell) / bitfinex.eth#usd.buy * 100 > 0',
            envOptions);
        assert.equal(res.orders.length,0);

        res = await normalStrategyRunner.getConditionResult(
            '(bitfinex.eth#usd.buy - bitfinex.eth#usd.sell) / bitfinex.eth#usd.buy * 100 < 0',
            envOptions);
        assert.equal(res.orders.length == 2,true);

        done();
    });

});

/**
 * 获取市场行情深度
 * @param {String} site 
 * @param {String} [symbol] 如果为空，则获取网站全部的市场行情深度
 * @param {String} [mode] 获取数据模式，分为两种: pull、push 默认为push
 */
function getSymbolDepths(site){
    let client = testUtil.getClient();
    client.send({
        'event':'pull',
        'channel':'market',
        'parameters':{'site': site }
    });

    let promise = new Promise(function(resolve,reject){
        client.on('message',function(res){
            if(res.channel && res.channel == 'market'){
                let index = res.data.findIndex(p => p.site == site);
                if(index >= 0){
                    resolve(res);
                }
            }
        });
    });
    return promise;
}