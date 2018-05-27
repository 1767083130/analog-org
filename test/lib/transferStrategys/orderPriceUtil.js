'use strict';
const orderPriceUtil = require('../../../lib/transferStrategys/orderPriceUtil');
const co = require('co');
const assert = require('assert');

describe('计算币种加权价格测试. path: transferStrategys/orderPriceUtil.js', function () {

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    });

    it('getSymbolPrice 计算币种加权价格', function (done) {     
        let realPriceItems = [
            { symbol: "btc#cny", operateType: "buy", prices: [[1,108]] },
            { symbol: "etc#btc", operateType: "buy", prices: [[0.24,108],[0.26,108]] },
            { symbol: "eth#btc", operateType: "buy", prices: [[0.5,108]] }
        ];
        let avgPrices = orderPriceUtil.getAveragePriceOfSymbols(realPriceItems);

        let symbol = 'etc#btc';
        let symbolPrice = orderPriceUtil.getSymbolPrice(symbol,avgPrices);
        //{ settlementCoin: pricePath.settlementCoin, price: priceDecimal.ceil().toNumber() }
        assert.equal(symbolPrice.settlementCoin, 'btc');
        assert.equal(symbolPrice.price, 0.25);

        symbol = 'etc#cny';
        symbolPrice = orderPriceUtil.getSymbolPrice(symbol,avgPrices);
        assert.equal(symbolPrice.settlementCoin, 'cny');
        assert.equal(symbolPrice.price, 0.25);

        symbol = 'etc#etc';
        symbolPrice = orderPriceUtil.getSymbolPrice(symbol,avgPrices);
        assert.equal(symbolPrice.settlementCoin, 'etc');
        assert.equal(symbolPrice.price, 1);

        for(var i = 0; i < 1000; i++){ // 这里测试一下效率
            symbol = 'etc#eth';
            symbolPrice = orderPriceUtil.getSymbolPrice(symbol,avgPrices);
            assert.equal(symbolPrice.settlementCoin, 'eth');
            assert.equal(symbolPrice.price, 0.5);
        }

        done();
    });
    
    it('getMutilSymbolsPrice 计算多个币种加权价格', function (done) {     
        let realPriceItems = [
            { site: "test_site",symbol: "btc#cny", operateType: "buy", prices: [[1,108]] },
            { site: "test_site",symbol: "etc#btc", operateType: "buy", prices: [[0.24,108],[0.26,108]] },
            { site: "test_site", symbol: "eth#btc", operateType: "buy", prices: [[0.5,108]] }
        ];

        //{settlementCoin: settlementCoin,symbols: [{symbol: symbolParts.symbol, orgPrice: symbolPriceInfo.pric, price: symbolPriceInfo.price }]};
        let symbolsPriceInfo = orderPriceUtil.getMutilSymbolsPrice(realPriceItems);
        assert.equal(symbolsPriceInfo.settlementCoin,'btc');

        let getSymbolPriceItem = function(site,symbol){
            return symbolsPriceInfo.symbols.find(item => item.symbol == symbol && item.site == site);
        }

        assert.equal(getSymbolPriceItem("test_site","btc#cny").orgPrice,1);
        assert.equal(getSymbolPriceItem("test_site","eth#btc").price,0.5);
        assert.equal(getSymbolPriceItem("test_site","etc#btc").orgPrice,0.25);

        done();
    });
    
});