'use strict';

const trialMarketSymbol = require('../../../lib/transferStrategys/trialMarketSymbol');
const co = require('co');
const mongoose = require('mongoose');
const assert = require('assert');

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

    it('isReverseSymbolPath',function(done){
        let symbolPathA = [{ symbol: "btc#usd",reverse: false }];
        let symbolPathB = [{ symbol: "btc#usd",reverse: true }];
        let isReverse = trialMarketSymbol.isReverseSymbolPath(symbolPathA,symbolPathB);
        assert.equal(isReverse, true);
        done();
    });

    
    it.only('isRelativePathPair',function(done){
        let p = {
                 "siteA":"bitfinex","contractTypeA":"spot",
                 "pathA":["eth","usd","ltc"],
                 "siteB":"okex","contractTypeB":"spot",
                 "pathB":["eth","ltc"]
                };
        let q = {
                 "siteA":"bitfinex","contractTypeA":"spot",
                 "pathA":["ltc","usd","eth"],
                 "siteB":"okex","contractTypeB":"spot",
                 "pathB":["eth","ltc"]
                };
        let isRelative = trialMarketSymbol.isRelativePathPair(p,q);
        assert.equal(isRelative, true);

        p = {
            "siteA":"bitfinex","contractTypeA":"spot",
            "pathA":["ltc","btc","eth"],
            "siteB":"okex","contractTypeB":"spot",
            "pathB":["ltc","eth"]
        };
        q = {
            "siteA":"bitfinex","contractTypeA":"spot",
            "pathA":["eth","usd","ltc"],
            "siteB":"okex","contractTypeB":"spot",
            "pathB":["ltc","eth"]
        };
        isRelative = trialMarketSymbol.isRelativePathPair(p,q);
        assert.equal(isRelative, true);

        done();
    });


    
});