'use strict';

const root = require('algorithms'),
    dijkstra = root.Graph.dijkstra,
    Graph = root.DataStructures.Graph,
    symbolUtil = require('../utils/symbol'),
    Decimal = require('decimal.js');

const PRIOR_COINS = ['btc','eth'];

let orderPriceUtil = new class { 
    //todo 关于symbol的表达方式，必须去掉合约信息，正规的格式为： “btc#cny”； 不支持的symbol格式：  “btc#cny_spot”

    /**
     * 
     * @param {*} pricesOfSymbols 
     * @param {String} [settlementCoin] 
     */
    getMutilSymbolsPrice(pricesOfSymbols,settlementCoin){
        let avgPrices = this.getAveragePriceOfSymbols(pricesOfSymbols);
        let symbols = []; //{ site: "huobi",symbol: "btc#cny" }
        for(let item of pricesOfSymbols){
            symbols.push({ site: item.site, symbol: item.symbol });
        }
        
        //获取settlementCoin
        //先获取表达式中的全部settlementCoin，并按照出现次数排序
        var settlementCoins = [],symbolsPart = [];
        for(var i = 0; i < symbols.length; i++){
            let symbolInfo = symbolUtil.getSymbolParts(symbols[i].symbol,symbols[i].site);
            symbolsPart.push(symbolInfo);

            //coins.push(symbolInfo.targetCoin);
            let existItem = settlementCoins.find(item => item.settlementCoin == symbolInfo.settlementCoin);
            if(existItem){
                existItem.count++;
            } else {
                settlementCoins.push({settlementCoin: symbolInfo.settlementCoin, count: 1 });
            }
        }    
        settlementCoins.sort(function(a,b){
            return a.count > b.count ? -1 : 1;
        });

        //settlementCoin的确定方式： 如果路径中包含PRIOR_COINS中的货币类型，则优先使用此货币，如果没有，则使用次数最多的货币
        if(settlementCoin && settlementCoins.indexOf(settlementCoin) == -1){
            settlementCoin = null;
        }
        if(!settlementCoin){
            for(let priorCoin of PRIOR_COINS){
                if(settlementCoins.indexOf(settlementCoin) != -1){
                    settlementCoin = priorCoin;
                    break;
                }
            }
        }
        if(!settlementCoin){
            //优先使用设置的币种进行结算
            settlementCoin = settlementCoins[0].settlementCoin;
        }

        let priceOfSymbols = [];
        for(let symbolParts of symbolsPart){
            let symbolPriceInfo = this.getSymbolPrice(symbolParts.symbol,avgPrices);
            let priceOfSymbol = {
                site: symbolParts.site,
                symbol: symbolParts.symbol
            };
            
            if(symbolParts.targetCoin == settlementCoin){
                priceOfSymbol.orgPrice = 1;
                priceOfSymbol.price = 1;
                priceOfSymbols.push(priceOfSymbol);

            } else if(symbolPriceInfo.settlementCoin == settlementCoin){ //如果需要结算货币
                //比如结算货币为btc，那么"etc#btc"这种的就可以直接确定价格
                priceOfSymbol.orgPrice = symbolPriceInfo.price;
                priceOfSymbol.price = symbolPriceInfo.price;
                priceOfSymbols.push(priceOfSymbol);

            } else {
                //比如结算货币为btc，那么"etc#eth"这种的需要分三步计算价格(用btc结算)
                //（1）先计算"etc#eth"的价格
                let symbolPriceInfo1 = this.getSymbolPrice(symbolParts.symbol,avgPrices);
                //（2）再计算“eth#btc”的价格
                let tempSymbol = symbolUtil.getSymbolByParts(Object.assign({},symbolParts,{
                    settlementCoin: settlementCoin,
                    targetCoin: symbolParts.settlementCoin
                }));

                let symbolPriceInfo2 = this.getSymbolPrice(tempSymbol,avgPrices);
                priceOfSymbol.orgPrice = symbolPriceInfo1.price;
                priceOfSymbol.price = new Decimal(symbolPriceInfo1.price).div(symbolPriceInfo2.price).toNumber();
                
                //(3) 最后将（1）、（2）计算的价格相除就是最终的结果
                priceOfSymbols.push(priceOfSymbol);
            }
        }

        return {
            settlementCoin: settlementCoin,
            symbols: priceOfSymbols
        };
    }

    /**
     * 获取价格
     * 
     * @param {*} settlementCoin 
     * @param {Array} avgPrices e.g.  [{ symbol: "btc#cny", operateType: "buy", price: 1234 }]
     * @returns { 
     *    settlementCoin: "btc",   //结算货币
     *    price: 13423   //计算得出的价格
     *  }
     * @api public
     */
    getSymbolPrice(symbol,avgPrices){
        let symbols = [];
        for(let symbolPrice of avgPrices){
            symbols.push(symbolPrice.symbol);
        }
    
        let symbolParts = symbolUtil.getSymbolParts(symbol);
        if(symbolParts.settlementCoin == symbolParts.targetCoin){
            return { isSuccess: true,settlementCoin: symbolParts.targetCoin,price: 1 };
        }

        let pricePath = this.getCoinPricePath(symbols,symbolParts.settlementCoin);
        if(!pricePath.isSuccess){
            return pricePath;
        }

        let isEnd,priceDecimal,
            currentCoin = symbolParts.targetCoin;
        while(!isEnd){
            let previousCoin = pricePath.previous[currentCoin];
            if(!previousCoin){
                return {
                    isSuccess: false,
                    message: '无法计算币种市场价格，请检查交易条件表达式是否合理'
                };
            }

            if(currentCoin && previousCoin){
                let previousSymbolParts = Object.assign({},symbolParts,{
                    targetCoin: currentCoin,
                    settlementCoin: previousCoin
                });
                let previousSymbol = symbolUtil.getSymbolByParts(previousSymbolParts);
                let symbolPriceInfo = avgPrices.find(item => item.symbol == previousSymbol);
                priceDecimal = new Decimal(priceDecimal ? priceDecimal : 1).times(symbolPriceInfo.price);
            }
            
            isEnd = (previousCoin == symbolParts.settlementCoin);
            //lastCoin = currentCoin;
            currentCoin = previousCoin; 
        }

        return {
            isSuccess: true,
            settlementCoin: pricePath.coreCoin,
            price: priceDecimal.toNumber()
        };
    }

    /**
     * 计算加权平均价格
     * 
     * @param {Array} realPriceItems e.g.  [{ site: "huobi",symbol: "btc#cny", operateType: "buy", prices: [[1234,23423],[2234,23423]] }]
     */
    getAveragePriceOfSymbols(realPriceItems){
        let symbolsPrice = [];
        for(let realPriceItem of realPriceItems){
            //计算加权平均价格
            let avgPriceInfo = { 
                site: realPriceItem.site,
                operateType: realPriceItem.operateType,
                symbol: realPriceItem.symbol,
                price: 0, 
                amount: 0 
            };
    
            for(let step of realPriceItem.prices){
                if(step.amount == 0){
                    continue;
                }

                let totalAmount = new Decimal(avgPriceInfo.amount).plus(step[1]);
                let totalAsset = new Decimal(avgPriceInfo.price).times(avgPriceInfo.amount).plus(new Decimal(step[0]).times(step[1]));
                let avgPrice = totalAsset.div(totalAmount);
                avgPriceInfo.price =  avgPrice.toNumber();
                avgPriceInfo.amount = totalAmount.toNumber();
            }

            let reverseSymbolPrice = this._getReverseSymbolPrice(avgPriceInfo.symbol,avgPriceInfo.price);
            symbolsPrice.push(avgPriceInfo);
            symbolsPrice.push({
                site: avgPriceInfo.site,
                operateType: avgPriceInfo.operateType,
                symbol: reverseSymbolPrice.symbol,
                price: reverseSymbolPrice.price, 
                amount: avgPriceInfo.amount
            });
        }

        return symbolsPrice;
    }

    
    /**
     * 获取币的价格需要的路径
     * 
     * @param {Array} symbols e.g. ['btc#cny','eth#btc']
     * @param {String} settlementCoin 结算币种
     * @returns 返回前置货币关系 e.g.  { cny: "btc",eth: "btc" },表示如果需要计量cny的价格，必须先知道btc价格
     */
    getCoinPricePath(symbols,settlementCoin){
        var coins = [],
            coinsGraph = new Graph();
        for(var i = 0; i < symbols.length; i++){
            let symbolInfo = symbolUtil.getSymbolParts(symbols[i]);
            coinsGraph.addEdge(symbolInfo.targetCoin, symbolInfo.settlementCoin, 1);
            coinsGraph.addEdge(symbolInfo.settlementCoin, symbolInfo.targetCoin, 1);

            coins.push(symbolInfo.targetCoin);
            coins.push(symbolInfo.settlementCoin);
        }          

        if(!settlementCoin){
            return { isSuccess: false, message: '无法确定结算货币，请检查交易条件表达式是否合理'}
        }

        var shortestPath = dijkstra(coinsGraph, settlementCoin);
        let previous = shortestPath.previous;
        // for(let key in previous){
        //     previous[previous[key]] = key;
        // }
        
        return {
            isSuccess: true,
            coreCoin: settlementCoin,
            previous: previous
        } ;
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

module.exports = orderPriceUtil;