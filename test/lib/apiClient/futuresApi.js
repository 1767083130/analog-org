'use strict';

var request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    FuturesApi = require('../../../lib/apiClient/futuresApi');

const SYMBOL = 'btc#cny';
const CONTRACT_TYPE = 'week';

testApi('bitmex');
//testApi('okex');


function testApi(site){
    describe(`api. path: lib/platforms/api.js 网站：${site}`, function () {
        let api,
            orderId; //卖单ID

        //有比较耗时间的测试，设置每个测试的过期时间为1分钟
        this.timeout(1 * 60 * 1000);

        before(function (done) {
            api = new FuturesApi(site);
            done();
        });

        it('getRealPrice 获取即时价格 回调函数版', function (done) {
            api.getRealPrice('btc',CONTRACT_TYPE,function(err,res){
                assert.equal(!!res.isSuccess, true);
                assert.equal(res.realPrice.bids[0][0] > 0, true);
                done();
            });
        });

        it('getRealPrice 获取即时价格 generator函数版',async function (done) {
            let res = await api.getRealPrice(SYMBOL,CONTRACT_TYPE);
            assert.equal(!!res.isSuccess, true);
            assert.equal(res.realPrice.bids[0][0] > 0, true);

            done();
        });

        it('getBalance 获取期货账户信息', function (done) {
            api.getBalance('btc#cny',function(err,res){
                if(!res.isSuccess){
                    console.log('getBalance:' + res.message);
                }

                assert.equal(res.isSuccess,true);
                done();
            });
        });

        it('createOrder 挂单', function (done) {
            var options = {
                symbol: "btc#cny", //币种
                //side: { type: String, required: true }, //交易类型 buy(买入或者期货中的开仓)或sell(卖出或者期货中的平仓)。当action=trade时有效
                side: 'buy', //订单类型 （1、开仓  2、平仓）,必填
                amount: 100, //数量
                price: 1,   //价格,必填
                leverage: 5,	//可填 杠杆倍数（BTC周: 5、10、20 BTC季: 5、10 LTC周:5、10、20）
                tradePassword: '360yee11',	//可填	资金密码（用户开启交易输入资金密码，需要传入资金密码进行验证）
                storeId: 0	 //可填	下单仓位（默认为 0）
            };

            api.createOrder(options,function(err,res){
                assert.equal(res.isSuccess,true);
                orderId = res.id;
                done();
            });
        });

        it('fetchOrder 查询订单信息', function (done) {
            let options = { id: orderId,symbol: SYMBOL };
            api.fetchOrder(options,function(err,res){
                assert.equal(res.isSuccess,true);
                done();
            });
        });

        it('fetchRecentOrders 挂单查询',async function (done) {   
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

        it('cancelOrder 取消挂单', function (done) {
            let options = { id: orderId,symbol: SYMBOL };
            api.cancelOrder(options, function(err,res){
                assert.equal(res.isSuccess,true);
                done();
            });
        });


        it('getSystemCloseOrders 获取被减仓订单', function (done) {
            api.getSystemCloseOrders(SYMBOL,CONTRACT_TYPE,function(err,res){
                assert.equal(res.isSuccess,true);
                done();
            });
        });
    })
}