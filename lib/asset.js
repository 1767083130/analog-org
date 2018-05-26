'use strict';
const cacheClient = require('./apiClient/cacheClient').getInstance();
const utilsApi = require('ws-server').utilsApi;
const symbolUtil = require('../lib/utils/symbol');
const apiConfigUtil = require('./apiClient/apiConfigUtil');
const request = require('request');
const Decimal = require('decimal.js');

const MarketSite = 'bitfinex'; //
const BtcSymbol = 'btc#usd';
const RateTimes = 1.04; //TODO　　折算资产（一般设置为比特币场外价格/场内价格）

let asset = new class{

    /**
     * 统计资金盘所有资金总金额
     * @param {String} [site] 交易网站。如果为空，则获取全部网站的资金总金额
     */
    async getTotalAsset(site){
        let platforms = apiConfigUtil.getPlatforms();

        let walletInfo = [], //数据结构：[{ site: 'okex',items:[{}] }]
            positionsInfo = [];  //数据结构：[{ site: 'okex',items:[{}] }]
        for(let platform of platforms){
            if(site && platform.site != site){
                continue;
            }
            
            let positionItemsRes = cacheClient.getPositions(platform.site);
            let walletItemsRes = cacheClient.getWalletInfo(platform.site);

            if(!positionItemsRes.isSuccess){
                return { isSuccess: false, message: `获取交易网站${platform.site}账户仓位失败`};
            }
            if(!walletItemsRes.isSuccess){
                return { isSuccess: false,message: `获取交易网站${platform.site}账户资产失败` };
            }

            this._pushItems(platform.site,positionItemsRes.data || [],positionsInfo,'position');
            this._pushItems(platform.site,walletItemsRes.data || [],walletInfo,'wallet');
        }

        let ignoreCoins = [], ignoreSymbols = [],//警告信息
            coins = [];
        for(let siteWallet of walletInfo){
            for(let walletItem of siteWallet.items){
                if(new Decimal(walletItem.total).equals(0)){
                    continue;
                }
                this._plusCoinItem(coins,{ coin: walletItem.coin, total: walletItem.total,site: siteWallet.site });
            }
        }

        //未结清的盈亏应计入总资产
        for(let sitePositions of positionsInfo){
            let site =sitePositions.site;
            if(['bitfinex'].indexOf(site) == -1){ //todo 应可以进行配置.有些网站对账户资金是即时结算，而有的是平仓后结算
                continue;
            }

            for(let position of sitePositions.items){
                 //todo 这里扩展到其他网站时，会发生问题,没有进行处理的：
                 //(1) holdAmount的单位不同
                 //（2）行情信息可能获取不到，比如期货（okex）

                if(new Decimal(position.holdAmount).equals(0)){
                    continue;
                }

                let symbolParts = symbolUtil.getSymbolParts(position.symbol,site);
                let getSymbolPriceRes = this._getSymbolPrice(position.symbol,site);
                if(!getSymbolPriceRes.isSuccess){
                    ignoreSymbols.push({ symbol: position.symbol, site: site, amount: position.holdAmount });
                    continue;
                }
                let profit = new Decimal(getSymbolPriceRes.price).minus(position.avgPrice).times(position.holdAmount);
                if(position.positionType == 2){ //空仓时利润取反
                    profit = -profit;
                }
                this._plusCoinItem(coins,{ coin: symbolParts.settlementCoin, total: profit,site: site });
            }
        }
    
        let btcTotal = new Decimal(0);
        //考虑到交易网站都支持用btc兑换所有其他的币种，这里都将其他币种折算成btc。一旦条件不成立，这里的计算方式也必须要修改
        for(let coinItem of coins){
            if(coinItem.coin == 'btc'){
                btcTotal = btcTotal.plus(coinItem.total); 
                coinItem.btcTotal = coinItem.total;
                continue;
            } 
            
            let itemTotal; //币种换算成btc的总数量
            let getPriceRes = this._getCoinItemPrice(coinItem);
            if(getPriceRes.isSuccess){ //获取行情是否成功
                if(getPriceRes.isReverse){ //是否反转后才获得市场价格,比如，获取不到'usd#btc',反转后就可以获取到
                    itemTotal = new Decimal(1).div(getPriceRes.price).times(coinItem.total);
                    btcTotal = btcTotal.plus(itemTotal); 
                    coinItem.btcTotal = itemTotal;
                } else {
                    itemTotal = new Decimal(getPriceRes.price).times(coinItem.total);
                    btcTotal = btcTotal.plus(itemTotal); 
                    coinItem.btcTotal = itemTotal;
                }
            } else {
                ignoreCoins.push({ coin: coinItem.coin, amount: coinItem.total,items: coinItem.items })
            }
        }

        let btcRate,
            getRateRes = await this.getBtcRate();
        if(!getRateRes.isSuccess){
            return { isSuccess: false, message: "系统异常！获取比特币对人民币汇率时发生错误"}
        }
        btcRate = getRateRes.rate;

        let otherTotal = await this.getOtherAssetTotal();
        let total = btcTotal.times(btcRate).plus(otherTotal).toNumber(2);
        let lastTotal = 4107115; //TODO 这个数据应该从结算数据中获取

        return { 
            isSuccess: true,
            data: {
                "asset":{
                    "btcTotal": btcTotal.toFixed(5),
                    "rate": btcRate,
                    "total": total,
                    "lastTotal": lastTotal,
                    "ignoreSymbols": ignoreSymbols,
                    "ignoreCoins": ignoreCoins
                },
                "coins": coins
            }
        }
    }

    _getCoinItemPrice(coinItem){
        let isReverse = false, //是否反转后才获得市场价格,比如，获取不到'usd#btc',反转后就可以获取到
            price, //市场价格
            symbol; //交易品种    
        let site = coinItem.items[0].site;

        symbol = symbolUtil.getSymbolByParts({targetCoin: coinItem.coin,settlementCoin: 'btc' });
        let getSymbolPriceRes = this._getSymbolPrice(symbol,site);

        if(!getSymbolPriceRes.isSuccess){
            //获取市场行情失败，反转后再试试,比如，获取不到'usd#btc'的行情信息,反转后就变成'btc#usd',这就可以获取到
            let reverseSymbol = symbolUtil.getSymbolByParts({targetCoin:  'btc',settlementCoin: coinItem.coin});
            getSymbolPriceRes = this._getSymbolPrice(reverseSymbol,site);
            if(getSymbolPriceRes.isSuccess){
                isReverse = true;
                price = getSymbolPriceRes.price;
            } 
        } else {
            price = getSymbolPriceRes.price;
        }

        return { isSuccess: !!price, price: price, isReverse: isReverse, symbol: symbol }
    }

    /**
     * 获取交易品种市场价格
     */
    _getSymbolPrice(symbol,site){
        let getCoinDepthRes = cacheClient.getSymbolDepths(MarketSite,symbol);  //bitfinexMarket.data.find(p => p.symbol == symbol); 
        if(!getCoinDepthRes.isSuccess){
            getCoinDepthRes = cacheClient.getSymbolDepths(site,symbol);
            if(!getCoinDepthRes.isSuccess){
                return { isSuccess: false,message: `获取交易品种${symbol}行情失败` };
            }
        }

        let coinDepth = getCoinDepthRes.data;
        let symbolPrice = new Decimal(coinDepth.bids[0][0]).plus(coinDepth.asks[0][0]).div(2);
        return { isSuccess: true, price: symbolPrice };
    }

    _plusCoinItem(coins,coinItem){
        let orgCoin = coins.find(p => p.coin == coinItem.coin);
        if(orgCoin){
            orgCoin.total = new Decimal(orgCoin.total).plus(coinItem.total).toNumber();
        } else {
            orgCoin = {
                coin:  coinItem.coin,
                total: coinItem.total,
                //site: coinItem.site
            }
            coins.push(orgCoin);
        }

        orgCoin.items = orgCoin.items || [];
        let orgSiteItem = orgCoin.items.find(p => p.site == coinItem.site);
        if(orgSiteItem){
            orgSiteItem.total = new Decimal(orgSiteItem.total).plus(coinItem.total).toNumber();
        } else {
            orgSiteItem = {
                site: coinItem.site,
                total: coinItem.total
            }
            orgCoin.items.push(orgSiteItem);
        }
    }

    /**
     * 缓存数据项
     * @param {String} site 交易网站名称
     * @param {Array} items 数据项
     * @param {Object} info e.g [{ site: 'okex',items:[{}] }]
     * @param {String} type 数据类型，可选值：position,wallet 
     */
    _pushItems(site,items,info,type){
        let oldItems = info.find(function(value){
            return value.site == site;
        });
        if(!oldItems){
            oldItems = [];
            info.push({ site: site, items: items });
            return;
        }

        for(let item of items){
            let orgItemIndex = oldItems.findIndex(function(value){
                if(type == 'position'){
                    return value.symbol == item.symbol;
                } else { //wallet
                    return value.coin == item.coin;
                }
            });

            if(orgItemIndex >= 0){
                oldItems[orgItemIndex] = item;
            } else {
                oldItems.push(item);
            }
        }
    }

    async getOtherAssetTotal(){
        //TODO
        return 0;
    }

    /**
     * 获取btc兑人民币汇率
     */
    async getBtcRate(){
        try{
            let getDepthRes = cacheClient.getSymbolDepths(MarketSite,BtcSymbol);
            if(!getDepthRes.isSuccess){
                return { isSuccess: false };
            }
            let getRateRes = await utilsApi.getUsdRate();
            if(!getRateRes.isSuccess){
                return { isSuccess: false };
            }

            let depth = getDepthRes.data;
            let symbolPrice = new Decimal(depth.bids[0][0]).plus(depth.asks[0][0]).div(2).times(getRateRes.rate);
            return { 
                isSuccess: true,
                rate: symbolPrice.times(RateTimes).toNumber() 
            };
        } catch(err) {
            return { isSuccess: false };
        }
    }

    /**
     * 获取btc兑人民币汇率(过期)
     */
    async getBtcRate_obsolate(){
        let res;
        const get = function(url){
            return new Promise(function(resolve, reject) {
                request.get(url, function(err, response, body){
                    if (err) {
                        reject(err);
                    } else {
                        resolve(body);
                    }
                });
            });
        }

        try{
            //先获取场外场内价格
            let url = 'https://localbitcoins.com/buy-bitcoins-online/CN/china/.json';
            let apiRes = await get(url);
            let json = JSON.parse(apiRes);
            res = {
                isSuccess: true,
                rate: +json.data.ad_list[0].data.temp_price
            };
        } catch(err){
            res = { "isSuccess": false };
        }

        return res;
    }

    getApiCoin(site,coin){
        this.getEqualPairs();
    }

    async getUserAsset(){

    }

}()

module.exports = asset
