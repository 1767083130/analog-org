'use strict';

const cacheClient = require('./apiClient/cacheClient').getInstance();
const apiConfigUtil = require('./apiClient/apiConfigUtil');
const symbolUtil = require('./utils/symbol');
const common = require('./common');
const symbolPriceUtil = require('./symbolPriceUtil');
const Decimal = require('decimal.js');

let realTimePrice = new class{

    /**
     * 获取市场行情深度
     * @param {String} site 
     * @param {String} [symbol] 如果为空，则获取网站全部的市场行情深度
     * @returns {Object} e.g { isSuccess: true, data: { site: "huobi",symbol: "btc#usd",bids:[],asks:[] }  }
     *          其中，当symbol为空时，data为数组;不为空时，data为Object类型
     */
    getSymbolDepths(site,symbol){
        let getDepthsRes = cacheClient.getSymbolDepths(site,symbol);
        return getDepthsRes;
    }

    /**
     * 获取交易品种价格
     * @param {String} site 交易网站
     * @param {String} symbol 交易品种
     * @param {Number} [maxStepsCount] 最大步数,默认为1
     * @param {Function} [getDepthPrice]
     * @returns {Object} e.g { isSuccess: true, price: price.toNumber() }
     */
    getSymbolPrice(site,symbol, maxStepsCount = 1, getDepthPrice){
        let symbols = apiConfigUtil.getSymbols(site);
        getDepthPrice = getDepthPrice || this._getAvgPrice;
        if(maxStepsCount < 1){
            maxStepsCount = 1;
        }

        let sameSymbol = symbols.find(t => t == symbol);
        if(sameSymbol){
            let getDepthsRes = cacheClient.getSymbolDepths(site,symbol);
            if(getDepthsRes.isSuccess){
                return {
                    isSuccess: true,
                    price: getDepthPrice(getDepthsRes.data,false)
                }
            }
        }

        //不存在直接的交易品种，尝试多个品种多次交易
        let getDepthsRes = cacheClient.getSymbolDepths(site);
        if(!getDepthsRes.isSuccess){
            return { isSuccess: false, message: `找不到网站${site}的行情信息` };
        }

        symbols.length = 0;
        let symbolDepths = getDepthsRes.data;
        for(let depth of symbolDepths){
            symbols.push(depth.symbol);
        }

        let getSymbolPathsRes = symbolPriceUtil.getSymbolPaths(symbol,symbols);
        if(!getSymbolPathsRes.isSuccess){
            return { isSuccess: false, message: `无法根据交易网站${site}的行情信息获取到交易品种${symbol}的价格` };
        }

        let symbolPaths = getSymbolPathsRes.paths;
        if(symbolPaths.length == 0 || symbolPaths.length > maxStepsCount){
            return { isSuccess: false, message: `受步数限制，无法根据交易网站${site}的行情信息获取到交易品种${symbol}的价格` };
        }

        let price = new Decimal(1);
        for(let symbolPath of symbolPaths){
            let itemSymbol = symbolPath.symbol;
            if(symbolPath.reverse){
                let symbolParts = symbolUtil.getSymbolParts(symbolPath.symbol);
                let reverseSymbolParts = Object.assign({},symbolParts,{
                    targetCoin: symbolParts.settlementCoin,
                    settlementCoin: symbolParts.targetCoin
                });
                let reverseSymbol = symbolUtil.getSymbolByParts(reverseSymbolParts);
                itemSymbol = reverseSymbol;
            }
            
            let getSymbolDepthRes = cacheClient.getSymbolDepths(site,symbolPath.symbol);
            if(!getSymbolDepthRes.isSuccess){
                return getSymbolDepthRes;
            }

            let symbolDepth = getSymbolDepthRes.data;
            let symbolPrice = getDepthPrice(symbolDepth,symbolPath.reverse)
            if(symbolPath.reverse && symbolPrice != 0){
                symbolPrice = new Decimal(1).div(symbolPrice);
            }

            price = price.times(symbolPrice);
        }

        return { isSuccess: true, price: price.toNumber() }
    }

    _getAvgPrice(depth){
        return new Decimal(depth.bids[0][0]).plus(depth.asks[0][0]).div(2).toNumber();
    }

    _getReverseSymbolPrice(symbol,price){
        let symbolInfo = symbolUtil.getSymbolParts(symbol);
        let newSymbolParts = Object.assign({},symbolInfo,{
            targetCoin: symbolInfo.settlementCoin,
            settlementCoin: symbolInfo.targetCoin
        });

        let newSymbol = symbolUtil.getSymbolByParts(newSymbolParts);
        let newPrice = new Decimal(1).div(price).toNumber();
        
        return {
            symbol: newSymbol,
            price: newPrice
        }
    }

}();

module.exports = realTimePrice;

