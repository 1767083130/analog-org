'use strict';

const trialMarketSymbol = require('../../../lib/transferStrategys/trialMarketSymbol');
const co = require('co');
const mongoose = require('mongoose');

describe('支付测试. path: transferStrategys/trialMarketSymbol.js', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    //this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('getSymbolPathPairs', function (done) {
        co(function *(){
            trialMarketSymbol.getSymbolPathPairs()
            done();
        }).catch(function(e){
            done(e);
        });
    });
    
});