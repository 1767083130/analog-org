const Decimal = require('decimal.js');
const configUtil = require('./utils/configUtil');
const apiConfitUtil = require('./apiClient/apiConfigUtil');
const symbolUtil = require('./utils/symbol');
const realPriceLib = require('./realTimePrice'); 

const Natural_Symbol = configUtil.getBusiness().natural; //本位币 //TODO

/** 图算法相关 */
const root = require('algorithms'),
    dijkstra = root.Graph.dijkstra,
    Graph = root.DataStructures.Graph;

let symbolPriceUtil = new class{
 

    /**
     * 获取在某个网站中，卖出一定数量的交易品种，市场能给出的价格
     * 
     * @param {String} [site] 网站名称.参数site和realPrices两者不能全为空
     * @param {String} symbol 交易品种.这个必须是交易所支持的品种
     * @param {Number} [amount] 需要卖出的数量，默认为0,这里只能为正数
     * @param {String} [operateType] 进行套利时需进行的交易类型，值为buy or sell,如果没有设置，则默认为sell
     * @param {Number} [leftDiscount] 如果市场不能承受数量为参数amount的卖压，剩余的量在已计算的价格上打几折。默认为1
     * @param {Object} [realPrices] 市场价格信息,如果参数为空，会自动读取当前的市场价格
     */
    async getMarketPrice(site,symbol,amount = 0,operateType = 'sell',leftDiscount = 1,realPrices){
        if(!realPrices){
            let getRealPricesRes = await realPriceLib.getSymbolDepths(site,symbol);
            if(!getRealPricesRes.isSuccess){
                return { isSuccess: false, message: `获取交易品种的价格失败。返回信息：${getRealPricesRes.message}`};
            }
        }
        
        leftDiscount = leftDiscount || 1;
        amount = amount || 0;
        let priceItems = (operateType == 'buy' ? realPrices.asks : realPrices.bids);
        let leftAmount = new Decimal(amount),
            stepAmount = new Decimal(amount),
            totalAsset = new Decimal(0);
        for(let sellItem of priceItems){
            let itemPrice = sellItem[0],
                itemAmount =  sellItem[1];
            //min(itemAmount,leftAmount)
            stepAmount = leftAmount.greaterThan(itemAmount) ? itemAmount : leftAmount;
            leftAmount = leftAmount.minus(stepAmount);
            totalAsset = totalAsset.plus(new Decimal(itemPrice).times(stepAmount)); 

            if(leftAmount.lessThanOrEqualTo(0)){
                break;
            }
        }

        let assetAmount = new Decimal(amount).minus(leftAmount);
        let avgPrice = new Decimal(totalAsset).div(assetAmount); //表示根据获取到的市场价格，能卖出数量资产的平均价格
        let price = avgPrice; //对不能成交的部分进行折让后计算得到的每单位的资产价格

        if(leftAmount.greaterThan(0)){
            //price = (leftAmount * avgPrice * leftDiscount + totalAsset) / amount;
            price = leftAmount.times(avgPrice).times(leftDiscount).plus(totalAsset).div(amount);
        }

        let symbolParts = symbolUtil.getSymbolParts(symbol,site);
        return {
            isSuccess: true,
            price: price.toNumber(),  //对不能成交的部分进行折让后计算得到的每单位的资产价格
            avgPrice: avgPrice.toNumber(), //表示根据获取到的市场价格信息，能卖出数量资产的平均价格
            amount: assetAmount.toNumber(), //表示根据获取到的市场价格信息，能卖出的数量
            settlementCoin: symbolParts.settlementCoin,
            fixed: assetAmount.greaterThanOrEqualTo(amount) //表示根据获取到的市场价格，是否能全部成交
        };
    }

    getSiteCoinPricePath(site,settlementCoin){
        let symbols = [];
        let siteConfig = apiConfitUtil.getPlatform(site);
        for(let symbolItem of siteConfig.symbols){
            symbols.push(symbolItem.symbol);
        }

        return this.getCoinPricePath(symbols,settlementCoin);
    }

     /**
     * 获取交易品种价格
     * 
     * @param {String} symbol 目标交易品种。这个交易品种可能并不是交易网站直接支持的
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
     * 获取某个交易品种价格的所需要经过的路径
     * @param {*} symbol 目标交易品种。这个交易品种可能并不是交易网站直接支持的
     * @param {*} symbols 所有能一步直接进行交易的交易品种。一般指的是交易所存在的交易品种
     */
    getSymbolPaths(symbol,symbols){
        let symbolParts = symbolUtil.getSymbolParts(symbol);
        if(symbolParts.settlementCoin == symbolParts.targetCoin){
            throw new Error('symbol中的两个币种不能相同');
        }

        let pricePath = this.getCoinPricePath(symbols,symbolParts.targetCoin);
        if(!pricePath.isSuccess){
            return pricePath;
        }

        let isEnd,priceDecimal,paths = [],
            currentCoin = symbolParts.settlementCoin;
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
                    targetCoin: previousCoin,
                    settlementCoin: currentCoin
                });
                let previousSymbol = symbolUtil.getSymbolByParts(previousSymbolParts);
                let symbolItem = symbols.find(t => t == previousSymbol);
                if(!symbolItem){
                    //将结算币种和目标币种进行反转
                    previousSymbolParts = Object.assign({},symbolParts,{
                        targetCoin: previousCoin,
                        settlementCoin: currentCoin
                    });
                    previousSymbol = symbolUtil.getSymbolByParts(previousSymbolParts);

                    paths.push({
                        symbol: previousSymbol,
                        reverse: true
                    });
                } else {
                    paths.push({
                        symbol: previousSymbol,
                        reverse: false
                    });
                }
            }
            
            isEnd = (previousCoin == symbolParts.targetCoin);
            currentCoin = previousCoin; 
        }

        return {
            isSuccess: true,
            paths: paths
        };
    }
        
    /**
     * 获取币的价格需要的路径
     * 
     * @param {Array} symbols, 可以确定价格的交易品种。一般指的是交易所存在的交易品种 e.g. ['btc#cny','eth#btc']
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

        if(coins.indexOf(settlementCoin) == -1){
            return { isSuccess: false, message: `无法通过参数symbols关联到结算货币${settlementCoin}`}
        }

        var shortestPath = dijkstra(coinsGraph, settlementCoin);
        let previous = shortestPath.previous;
        // for(let key in previous){
        //     previous[previous[key]] = key;
        // }
        
        return {
            isSuccess: previous,
            coreCoin: settlementCoin,
            previous: previous
        } ;
    }
}();

module.exports = symbolPriceUtil;