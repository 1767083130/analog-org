'use strict';

var //app = require('../../index.js'),
    request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    api = require('../../lib/apiclient/api'),
    futureIndex = require('../../lib/futureIndex');

describe('期货指数价格. path: futureIndex.js', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });

    it('getSyncRealPrices 直接从网站同步获取多个网站多个币种的即时价格', function (done) {
        co(function *(){
            done();
        }).catch(function(e){
            done(e);
        });
    });

    it('getRealPrice 获取即时价格', function (done) {
        co(function *(){
            done();
        }).catch(function(e){
            done(e);
        });
    });

    it('getMarketPrice 获取在某个网站中，卖出一定数量的交易品种，市场能给出的价格', function (done) {
        co(function *(){
            done();
        }).catch(function(e){
            done(e);
        });
    });

})