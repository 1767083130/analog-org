'use strict';

var  request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    BtcTradeApi = require('../../../lib/apiClient/platforms/btctrade/api');


describe(`api. path: platforms/btctrade/api.js 网站：btctrade`, function () {
    let api,
        sellId; //卖单ID

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        api = new BtcTradeApi();
        done();
    });

    it('fetchSinceOrders 挂单查询', function (done) {
        var dayMilli = 24 * 60 * 60 * 1000;
        var yesterday = ((+new Date() - dayMilli) / 1000) | 0 

        var options = {
            symbol: "eth#cny",  //交易币种（btc#cny,eth#cny,ltc#cny,doge#cny,ybc#cny）
            type: 'all',  //  挂单类型[open:正在挂单, all:所有挂单]
            since: yesterday
            //since: yesterday.toLocaleString() //+new Date() - dayMilli //时间戳, 查询某个时间戳之后的挂单
        };

        api.fetchSinceOrders(options,function(err,res){
            assert.equal(res.isSuccess,true);
            done();
        });
    });

})