'use strict';

var  request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    YunbiApi = require('../../../lib/apiClient/platforms/yunbi/api');


describe(`api. path: platforms/yunbi/api.js 网站：yunbi`, function () {
    let api,
        sellId; //卖单ID

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        api = new YunbiApi();
        done();
    });

    it('fetchStatusOrders 挂单查询', function (done) {
        let options = {
            symbol: "btc#cny",
            pageIndex: 0,
            pageSize: 10,
            status: 'done' //wait
        };

        api.fetchStatusOrders(options,function(err,res){
            assert.equal(res.isSuccess,true);
            done();
        });
    });

})