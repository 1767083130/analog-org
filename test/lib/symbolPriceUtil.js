   'use strict';

var request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    api = require('../../lib/apiclient/api'),
    symbolPriceUtil = require('../../lib/symbolPriceUtil');

describe('币种即时价格. path: realTimePrice.js', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });

    it('getSymbolPaths', function (done) {
        let symbols = ['btc#usd','eth#btc'],
            symbol = "eth#usd";
        
        let res = symbolPriceUtil.getSymbolPaths(symbol,symbols);
    });

    it('getMarketPrice 获取在某个网站中，卖出一定数量的交易品种，市场能给出的价格',async function (done) {
        // /**
        //  * 获取在某个网站中，卖出一定数量的交易品种，市场能给出的价格
        //  * 
        //  * @param {String} site 网站名称
        //  * @param {String} symbol 交易品种
        //  * @param {Decimal} amount 需要卖出的数量
        //  * @param {Object} [realPrices] 市场价格信息 
        //  */
        // * getMarketPrice(site,symbol,amount, realPrices)
        let marketPrice;
        //现货 
        let realPrices = {
            time: new Date(), //时间
            site: "chbtc", //交易网站
            symbol: "btc#cny", //币种
            bids: [[4005,1.3],[4004,1.54],[4003,1.45]], //买入委托，按照价格降序排序
            asks: [[4006,1],[4007,1],[4008,1]] //卖出委托，按照价格升序排序
        };
        marketPrice = await symbolPriceUtil.getMarketPrice('chbtc','btc#cny',1,'buy',1,realPrices);
        assert.equal(marketPrice.price,4006);

        marketPrice = await symbolPriceUtil.getMarketPrice('chbtc','btc#cny',3,'buy',1,realPrices);
        assert.equal(marketPrice.price,4007);

        done();
    });

})