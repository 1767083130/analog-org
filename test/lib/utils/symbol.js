'use strict';

const assert = require('assert');
const symbolUtil = require('../../../lib/utils/symbol');

describe('path: utils/symbol.js', function () {
    //使用文档详见： http://mikemcl.github.io/decimal.js/#Dceil
    it('symbol 使用实例', function (done) {
        let symbolInfo = symbolUtil.getFullSymbol('btc#cny','huobi');
        assert.equal(symbolInfo.fullSymbol,'btc#cny_spot');

        symbolInfo = symbolUtil.getFullSymbol('btc','huobi');
        assert.equal(symbolInfo.fullSymbol,'btc#cny_spot');

        symbolInfo = symbolUtil.getFullSymbol('btc_7d','huobi');
        assert.equal(symbolInfo.fullSymbol,'btc#cny_7d');

        symbolInfo = symbolUtil.getFullSymbol('btc_h1731','huobi');
        assert.equal(symbolInfo.fullSymbol,'btc#cny_h1731');

        symbolInfo = symbolUtil.getFullSymbol('btc_h17','huobi');
        assert.equal(symbolInfo.fullSymbol,'btc#cny_h1731');

        symbolInfo = symbolUtil.getFullSymbol('btc_ever','huobi');
        assert.equal(symbolInfo.fullSymbol,'btc#cny_ever');

        done();
    });
})