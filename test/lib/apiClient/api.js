'use strict';

var request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    Api = require('../../../lib/apiClient/api');

const SYMBOL = 'btc#cny';
//testApi('btctrade');
//testApi('yunbi');
//testApi('bitmex');
//testApi('okcoin');
testApi('bitfinex');
//testApi('chbtc');

function testApi(site){
    describe(`api. path: lib/platforms/api.js 网站：${site}`, function () {
        let api,
            sellId,buyId; //卖单ID

        //有比较耗时间的测试，设置每个测试的过期时间为1分钟
        this.timeout(1 * 60 * 1000);

        before(function (done) {
            api = new Api(site);
            done();
        });

        it('getRealPrice 获取即时价格 回调函数版', function (done) {
            api.getRealPrice('btc',function(err,res){
                assert.equal(!!res.isSuccess, true);
                assert.equal(res.realPrice.bids[0][0] > 0, true);
                done();
            });
        });

        it('getRealPrice 获取即时价格 generator函数版', async function (done) {
            let res = await api.getRealPrice(SYMBOL);
            assert.equal(!!res.isSuccess, true);
            assert.equal(res.realPrice.bids[0][0] > 0, true);
            
            done();
        });


        it('buy 挂买单', function (done) {
            
    // /**
    //  * 挂单
    //  * 
    //  * @param {Object} options  请求参数，
    //  * @param {String} options.symbol 交易品种
    //  * @param {String} options.side 交易类型。可能的值：buy(买入或者期货中的开仓)或sell(卖出或者期货中的平仓) 
    //  * @param {Number} options.amount 数量
    //  * @param {Number} options.price  价格,必填
    //  * @param {String} options.type Either “market” / “limit” / “stop” / “trailing-stop” / “fill-or-kill” 
    //                           / “exchange market” / “exchange limit” / “exchange stop” / “exchange trailing-stop” 
    //                           / “exchange fill-or-kill”. (type starting by “exchange ” are exchange orders, others are margin trading orders)
    //  * @param {Boolean} [options.isHidden] 是否为隐藏单，支持的系统有bitfinex
    //  * @param {Boolean} [options.isPostOnly] 当type="limit"有效。仅部分系统支持，如bitfinex 感觉是fill or kill的反面，也就是说，如果提交了post-only单，且这个单子会立刻成交的话，就自动撤单（或者移开一个最小价位）。只有这个单子能挂上去不被立刻成交的时候才会下单。
    //  * @param {Number} [options.leverage]  杠杆倍数（BTC周: 5、10、20 BTC季: 5、10 LTC周:5、10、20）
    //  * @param {String} [options.tradePassword]  资金密码（用户开启交易输入资金密码，需要传入资金密码进行验证）
    //  * @param {Function} callback 回调函数
    //  * @returns {"result":true,"outerId":123} outerId: 交易平台返回的挂单ID; result: true(成功), false(失败)
    //  */
    // createOrder(options,callback){
            var options = {symbol: SYMBOL, amount: 0.1, price: 1}
            api.buy(options,function(err,res){
                if(!res.isSuccess){
                    console.log('buy 挂买单:' + res.message);
                }

                assert.equal(res.isSuccess,true);
                buyId = res.outerId;
                done();
            });
        });

        it('sell 挂卖单', function (done) {
            //wait(1000);
            var options = {symbol: SYMBOL, amount: 0.1, price: 1000}
            api.sell(options,function(err,res){
                if(!res.isSuccess){
                    console.log('sell 挂卖单:' + res.message);
                }
                assert.equal(res.isSuccess,true);
                sellId = res.outerId;
                console.log(sellId); //
                done();
            });
        });
        
        it('getAccountInfo 获取账户信息', function (done) {
            //wait(1000);
            api.getAccountInfo(function(err,res){
                if(!res.isSuccess){
                    console.log('getAccountInfo 获取账户信息:' + res.message);
                }

                assert.equal(res.isSuccess,true);
                done();
            });
        });

        it('fetchRecentOrders 挂单查询', async function (done) {   
            //wait(1000); 
            let since = ((+new Date() - 8 * 60 * 60 * 1000) / 1000) | 0;
            var options = {
                symbol: SYMBOL,  //交易币种（btc#cny,eth#cny,ltc#cny,doge#cny,ybc#cny）
                type: 'all',  //  挂单类型[open:正在挂单, all:所有挂单]
                since: since
                //since: yesterday.toLocaleString() //+new Date() - dayMilli //时间戳, 查询某个时间戳之后的挂单
            };

            let fetchRes = await api.fetchRecentOrders(options,function(err,res){
                if(!res.isSuccess){
                    console.log('fetchRecentOrders 挂单查询:' + res.message);
                }
                assert.equal(res.isSuccess,true);
            });

            assert.equal(fetchRes.isSuccess,true);
            done();
        });

        it('fetchOrder 获取单', async function (done) {
            let getOrderRes = await api.fetchOrder({id: sellId,symbol: SYMBOL});
            if(!getOrderRes.isSuccess){
                console.log('fetchOrder 获取单:' + getOrderRes.message);
            }

            assert.equal(getOrderRes.isSuccess,true);
            done();
        });

        it('cancelOrder 取消挂单', function (done) {
            //wait(1000);
            var id = sellId || 1;
            api.cancelOrder({id: id, symbol: SYMBOL},function(err,res){
                if(!res.isSuccess){
                    console.log('cancelOrder 取消挂单:' + res.message);
                }
                assert.equal( res.isSuccess,true);
                done();
            });
        });
    })
}