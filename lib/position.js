﻿'use strict';
const cacheClient = require('./apiClient/cacheClient').getInstance();
const mongoose = require('mongoose');
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const AccountHistory = mongoose.model('AccountHistory');
const Api = require('./apiClient/api');
const Decimal = require('decimal.js');

const co = require('co');
const realTimePrice = require('./realTimePrice');
const apiConfigUtil = require('./apiClient/apiConfigUtil');
const common = require('./common');
const symbolUtil = require('./utils/symbol');
const asset = require('./asset');
const utilsApi = require('ws-client').utilsApi;

const MarketSite = 'bitfinex'; //
const BtcSymbol = 'btc#usd';
const STEP_PERCENT = 100;

const RateTimes = 1.04; //折算资产（一般设置为比特币场外价格/场内价格）

let position = new class{

    /**
     * 统计资金盘仓位情况
     * @param {String} [site] 交易网站。如果为空，则统计全部网站的汇总仓位
     */
    async getPositions(site,lazyMode = false){
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
            let site = sitePositions.site;
            for(let position of sitePositions.items){
                //todo 这里扩展到其他网站时，会发生问题,没有进行处理的：
                //(1) holdAmount的单位不同
                //（2）行情信息可能获取不到，比如期货（okex）
                if(new Decimal(position.holdAmount).equals(0)){
                    continue;
                }

                let symbolParts = symbolUtil.getSymbolParts(position.symbol,site);
                let settlementCoinAmount,
                    targetCoinAmount,
                    unit = this.getUnit(position.unit);
                if(unit.coin == symbolParts.settlementCoin){
                    settlementCoinAmount = new Decimal(position.holdAmount).times(unit.amount).toNumber();

                    let symbol = symbolUtil.getSymbolByParts(Object.assign({}, symbolParts, {
                        targetCoin: symbolParts.targetCoin,
                        settlementCoin: unit.coin
                    }));
                    let getSymbolPriceRes = this._getSymbolPrice(site,symbol);
                    if(!getSymbolPriceRes.isSuccess){
                        ignoreSymbols.push({ symbol: position.symbol, site: site, amount: position.holdAmount });
                        continue;
                    }
                    targetCoinAmount = new Decimal(settlementCoinAmount).div(getSymbolPriceRes.price).toNumber();

                } else if(unit.coin == symbolParts.targetCoin){
                    targetCoinAmount = new Decimal(position.holdAmount).times(unit.amount).toNumber();

                    let getSymbolPriceRes = this._getSymbolPrice(site,position.symbol);
                    if(!getSymbolPriceRes.isSuccess){
                        ignoreSymbols.push({ symbol: position.symbol, site: site, amount: position.holdAmount });
                        continue;
                    }
                    settlementCoinAmount = new Decimal(targetCoinAmount).times(getSymbolPriceRes.price).toNumber();

                } else {
                    throw new Error(`无法识别的交易单位:${JSON.stringify(unit)}`);
                }

                if(position.positionType == 2){ //空仓时取反
                    settlementCoinAmount = -settlementCoinAmount;
                    targetCoinAmount = -targetCoinAmount;
                }
                this._plusCoinItem(coins,{ coin: symbolParts.settlementCoin, total: -settlementCoinAmount,site: site });
                this._plusCoinItem(coins,{ coin: symbolParts.targetCoin, total: targetCoinAmount,site: site });

                if(['bitfinex'].indexOf(site) != -1){ //todo 应可以进行配置.有些网站对账户资金是即时结算，而有的是平仓后结算
                    let getSymbolPriceRes = this._getSymbolPrice(site,position.symbol);
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
        }
    
        let btcTotal = new Decimal(0),
            longBtcTotal = new Decimal(0),
            shortBtcTotal = new Decimal(0);
 
        //考虑到交易网站都支持用btc兑换所有其他的币种，这里都将其他币种折算成btc。一旦条件不成立，这里的计算方式也必须要修改
        for(let coinItem of coins){
            if(coinItem.coin == 'btc'){
                coinItem.btcTotal = coinItem.total;
                
                if(coinItem.total > 0){
                    longBtcTotal = longBtcTotal.plus(coinItem.total);
                } else {
                    shortBtcTotal = shortBtcTotal.plus(coinItem.total);
                }
                continue;
            } 
            
            let isPaperCurrency = this.isPaperCurrency(coinItem.coin);
            let isReverse = false, //是否反转后才获得市场价格,比如，获取不到'usd#btc',反转后就可以获取到
                 price, //市场价格
                 symbol, //交易品种
                 itemTotal; //币种换算成btc的总数量
            symbol = symbolUtil.getSymbolByParts({targetCoin: coinItem.coin,settlementCoin: 'btc' });
            let getSymbolPriceRes = this._getSymbolPrice(coinItem.site,symbol);

            if(!getSymbolPriceRes.isSuccess){
                //获取市场行情失败，反转后再试试,比如，获取不到'usd#btc'的行情信息,反转后就变成'btc#usd',这就可以获取到
                let reverseSymbol = symbolUtil.getSymbolByParts({targetCoin:  'btc',settlementCoin: coinItem.coin});
                getSymbolPriceRes = this._getSymbolPrice(coinItem.site,reverseSymbol);
                if(getSymbolPriceRes.isSuccess){
                    isReverse = true;
                    price = getSymbolPriceRes.price;
                } 
            } else {
                price = getSymbolPriceRes.price;
            }

            if(price){ //获取行情是否成功
                if(isReverse){
                    itemTotal = new Decimal(1).div(getSymbolPriceRes.price).times(coinItem.total);
                } else {
                    itemTotal = new Decimal(getSymbolPriceRes.price).times(coinItem.total);
                }
                coinItem.btcTotal = itemTotal;

                if(!isPaperCurrency){ //如果是法币则不累计到总数
                    if(itemTotal.greaterThan(0)){
                        longBtcTotal = longBtcTotal.plus(itemTotal);
                    } else {
                        shortBtcTotal = shortBtcTotal.plus(itemTotal);
                    }
                }
            } else {
                ignoreCoins.push({ coin: coinItem.coin, site: coinItem.site, amount: coinItem.total })
            }
        }

        let total,btcRate;
        let getRateRes = await this.getBtcRate();
        if(!getRateRes.isSuccess){
            return { isSuccess: false, message: "系统异常！获取比特币对人民币汇率时发生错误"}
        }
        btcRate = getRateRes.rate;
        btcTotal = longBtcTotal.abs().plus(shortBtcTotal.abs());
        total = btcTotal.times(btcRate).toNumber();
        // longBtcTotal = new Decimal(0),
        // shortBtcTotal = new Decimal(0);
        return { 
            isSuccess: true,
            data: {
                "asset":{
                    "btcTotal": btcTotal.toFixed(5),
                    "longBtcTotal": longBtcTotal.toFixed(5),
                    "shortBtcTotal": shortBtcTotal.toFixed(5),
                    "rate": btcRate,
                    "total": total,
                    "ignoreSymbols": ignoreSymbols,
                    "ignoreCoins": ignoreCoins
                },
                "coins": coins
            }
        }
    }

    getUnit(unit){
        let res;
        if(typeof unit == 'string'){
            let unitParts = unit.split('_');
            res = {
                amount: unitParts[0],
                coin: unitParts[1]
            }
        } else {
            res = unit;
        }

        return res;
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

            let depth = getDepthRes.data,
                usdRate = getRateRes.rate;
            let symbolPrice = new Decimal(depth.bids[0][0]).plus(depth.asks[0][0]).div(2).times(usdRate);
            return { 
                isSuccess: true,
                rate: symbolPrice
            };
        } catch(err) {
            return { isSuccess: false };
        }
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
     * 获取交易品种市场价格
     * @returns {Object} e.g { isSuccess: true, price: price.toNumber() }
     */
    _getSymbolPrice(site,symbol){
        //TODO 这里获取资产的价格标准不严，有可能导致爆仓
        return realTimePrice.getSymbolPrice(site,symbol);
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

    isPaperCurrency(coin){
        let paperCurrencys = this.getPaperCurrencys();
        return paperCurrencys.indexOf(coin) != -1;
    }

    /**
     * 获取系统牵涉到的所有法币
     */
    getPaperCurrencys(){
        return ['usd','usdt','cny','eur','jpy','qc','aed'];
    }

    /**
     * 计算仓位项中虚拟币的数量。因为计算仓位的单位不同，比如有的是10usd作为一个单位，
     * 有的是1btc作为一个单位，有时就需要统一使用btc进行计量
     * 
     * @param {Position} position 仓位
     */
    async getSymbolHoldAmount(position,realPrice){
        let unitName,unitAmount,price,symbolHoldAmount;
        let symbolParts = symbolUtil.getSymbolParts(position.symbol,position.site);
    
        if(position.unit.indexOf('_') != -1){
            let parts = position.unit.split('_');
            unitAmount = parts[0];
            unitName = parts[1];
        } else {
            unitAmount = 1;
            unitName = unit;
        }

        if([symbolParts.settlementCoin,unitName].indexOf(unitName) == -1){
            throw new Error(`此仓位仅支持${symbolParts.settlementCoin}和${unitName}的互换`);
        }

        //@returns {string} 货币符号.如 { settlementCoin: "cny",targetCoin: "btc", contractType: 'spot',dateCode: "1w" }
        if(symbolParts.targetCoin == unitName){
            symbolHoldAmount = new Decimal(unitAmount).times(position.holdAmount).toNumber();
        } else {
            if(!realPrice){
                realPrice = await realTimePrice.getRealPrice(position.site,position.symbol);
            }
            if(!realPrice){
                console.error(`获取不到网站${position.site}的交易品种${position.symbol}的市场价格深度`);
            }

            let isEnd = false;
            let steps = (position.positionType == 1 ? realPrice.asks : realPrice.bids);
            price = steps[0][0]; //可出售的价格
            symbolHoldAmount = new Decimal(position.holdAmount).times(unitAmount).div(price).toNumber();
        }

        return symbolHoldAmount;
    }

    /**
     * 同步账户
     */
    async syncPositions(userName,site){
    
    }

    getLimitConfig(){
        let config = {
            limits: [
                { symbol: "btc", max: 100, min: -100 },
                { symbol: "eth", max: 100, min: -100 }
            ],
            longs: [ //持有长线仓位（也可以认为是非对冲套取差价的仓位） 
                { site: "btctrade", symbol: "btc#cny", amount: 10 }  
            ]
        };

        for(let limitItem of config.limits){
            let symbolInfo = symbolUtil.getFullSymbol(limitItem.symbol);
            limitItem.symbol = symbolInfo.fullSymbol;
        }

        for(let longItem of config.longs){
            let symbolInfo = symbolUtil.getFullSymbol(longItem.symbol);
            longItem.symbol = symbolInfo.fullSymbol;
        }

        return config;
    }


    /**
     * 获取剩余可下单的金额。
     * 需要特别注意的是，可进行增仓仓位是动态变化的，如果进行了对仓位有影响的操作（比如下单，撤销订单等），需要再次调用此方法
     *
     * @param {String} userName 用户名
     * @param {String} site 网站名称 
     * @param {Object} options 可选参数，实际调用时一般不传值
             options.realPrice 市场价格，默认为当前市场价格
             options.stepPercent 每档成交百分比，默认为STEP_PERCENT = 100
             options.limitConfig 仓位限制
             options.account 账户钱包
             options.positions  持仓情况
     * @return {Array} 剩余可下单的金额,如果获取异常，则返回undefined。 e.g. [{
            symbol: symbolItem.fullSymbol, 
            total: 0, 
            type: 'buy',
            available: 0  
     *  }]
     * @api public
     */
    async getAmountUsable(userName,site,options){
        let amountsLeft = []; //账户可使用的剩余金额
        let account = options.account;
        if(!account){
            account = await account.getSiteAccount(userName,site);
        }

        let orgPositions = options.positions;
        if(!orgPositions){
            orgPositions = await this.getSitePositions(userName,site);
        }

        let platform = apiConfigUtil.getPlatform(site);
        let limitConfig = options.limitConfig || this.getLimitConfig();
        let standardCoin = symbolUtil.getStandardCoin(site); //本位币

        if(!platform){
            return amountsLeft;
        }

        let accountCoins = [],  //只能用于购买别的资产的货币
            positions = [].concat(orgPositions); //仓位.这里会新建一个数组，防止修改原有数组

        //整理账户信息和持有仓位。
        //在国内有些交易网站中（如huobi,chbtc,btctrade），持仓记录也放在了accounts，后面应当统一放在positions中
        //这里对它们进行了归位 //TODO 后面应该不需要
        for(let coinItem of account.coins){
            //platform.settlementCoins.spots;
            //platform.settlementCoins.futures
            //如果是只能用于当做购买别的资产的货币，则存入accountCoins数组
            //否则就是能进行双向交易的货币，则存入positions数组
            if(platform.settlementCoins && platform.settlementCoins.spots
               && platform.settlementCoins.spots.indexOf(coinItem.coin)){
                accountCoins.push(coinItem);
            } else {
                let position = {
                    site: site,
                    symbol: coinItem.coin,
                    storeId: 0,
                    status: 'active', //状态，可选值：closed,active
                    amount: coinItem.total,
                    //basePrice: apiPosition.POS_BASE_PRICE,
                    available: account.getAvailable(coinItem.coin), 
                    marginFunding: 0 //融资成本
                    //marginFundingType: (apiPosition.POS_MARGIN_FUNDING_TYPE || 'term').toLowerCase()  //融资计算方法，分为两种 'daily','term'
                };
                positions.push(position);
            }
        }


        //取得账户货币资产以本位币计量的总金额（注：结算货币有可能有多种,本位币只有一种）
        let assetTotal = new Decimal();
        for(let coinItem of accountCoins){
            let symbolItem = symbolUtil.getFullSymbol(coinItem.coin);
            let coinAmount = new Decimal(coinItem.total).minus(coinItem.frozen); //可用金额 = coinItem.total - coinItem.frozen
            let symbolLong = limitConfig.longs.find(value => { 
                return value.symbol == symbolItem.fullSymbol && value.site == site; 
            });
           
            if(symbolLong){
                coinAmount = coinAmount.minus(symbolLong.amount);
            }
   
            let coinValue = await this.getCoinsValue(site,[{ coin: coinItem.coin,amount: coinAmount }],'sell',options);
            if(Number.isNaN(coinValue)){
                return;
            }
            
            assetTotal = assetTotal.plus(coinValue.amount);
        }

        //取得账户货币资产以本位币计量的总金额
        let positionTotal = new Decimal();
        for(let position of positions){
            let coinValue = await this.getCoinsValue(site,[{ symbol: position.symbol,amount: position.amount }],'buy',options);
            if(Number.isNaN(coinValue)){
                return;
            }

            positionTotal = positionTotal.plus(coinValue.amount);
        }

        //根据账户现有持仓情况，判断还可以进行增仓的数量.
        for(let symbolItem of platform.symbols){
            //@returns {Object} 返回数据如,{ fullSymbol:"btc#cny_1w", contractType: "futures",isValid: true,message: "成功" }
            let symbolInfo = symbolUtil.getFullSymbol(symbolItem.symbol,site);
            if(!symbolInfo || !symbolInfo.isValid){
                continue;
            }

            //@returns 如symbol为"btc#cny"时，返回 { settlementCoin: "cny",targetCoin: "btc", dateCode: "" }
            let symbolParts = symbolUtil.getSymbolParts(symbolInfo.fullSymbol);

            //symbolAccount和symbolPosition是对当前的仓位描述
            let symbolAccount = accountCoins.find(value => { return value.symbol == symbolItem.fullSymbol; });
            let symbolPosition = positions.find(value => { return value.symbol == symbolItem.fullSymbol; });
            
            //symbolLimit（单个symbol的持仓量限制）和symbolLong（其他仓位要求，比如必须长线持有50个比特币，这50个比特币不能参与平台差价套取操作）是对仓位的限制
            let symbolLimit = limitConfig.limits.find(value => { return value.symbol == symbolItem.fullSymbol; });

            
            //根据账户资产情况和账户持有仓位，获取可以交易（买入和卖出）的数量
            //剩余总额 = 资产总额（accounts） - 已使用总额（positions） 
            let buyAvailable = 0, //可做多的数量
                sellAvailable = 0; //可做空的数量

            //本位币计量的账户总额，以结算货币进行计算.也就是说将账户可用资产折算成结算货币后的总量
            let symbol = `${symbolParts.settlementCoin}#${standardCoin}`
            let settlementCoinValue = await this.getCoinsValue(site,[{ symbol: symbol,amount: assetTotal }],'sell',options);
            if(Number.isNaN(settlementCoinValue)){
                return;
            }

            //计算可以做多的数量 
            buyAvailable = await this.getCoinsValue(site,[{ symbol: symbolInfo.fullSymbol,amount: settlementCoinValue }],'buy',options);
            if(Number.isNaN(buyAvailable)){
                return;
            }

            //计算可以做空的数量 
            sellAvailable = await this.getCoinsValue(site,[{ symbol: symbolInfo.fullSymbol,amount: settlementCoinValue }],'sell',options);
            if(Number.isNaN(sellAvailable)){
                return;
            }

            //platform.settlementCoins { spots: ["usd"], futures: ["usd"] }
            amountsLeft.push({
                symbol: symbolItem.fullSymbol,
                type: 'buy',
                available: buyAvailable
            });

            amountsLeft.push({
                symbol: symbolItem.fullSymbol,
                type: 'sell',
                available: sellAvailable
            });
        }

        return amountsLeft;
    }


    /**
     * 获取用户在某个交易网站的资产总值（以本位币计算）
     * 
     * @param {String} userName
     * @param {String} site
     * @return {Object} 资产总值 e.g. { standardCoin: "cny", amount: 10000 }
     * @api  public
     */
    getSiteTotalPositions(userName,site){
        //TODO
        throw new Error('调用了没有实现的方法');
    }

    /**
     * 获取用户所有的资产总值（以本位币计算）
     * 
     * @param {String} userName
     * @return {Object} 资产总值 e.g. { standardCoin: "cny", amount: 10000 }
     */
    getUserTotalPositions(userName){
        //TODO、
        throw new Error('调用了没有实现的方法');
    }


    _generateSymbol(targetCoin,settlementCoin){
        return `${targetCoin}#${settlementCoin}`;
    }


    /**
     * 获取用户在某个交易网站的资产总值（以本位币计算）
     * 
     * @param {String} site
     * @param {Array} accountCoins,账户项,需要注意的是，这里支持的资产可以为coin，也可以为symbol 
     *                    e.g. [{ coin: "btc",amount: 100 },{ symbol: "btc#cny",amount: 120 }]
     * @param {String} operateType 
     * @return {Number} 资产总值 e.g. 10000
     * @api private
     */
    async getCoinsValue(site,accountCoins,operateType,options){
        let total = new Decimal(0);
        let standardCoin = symbolUtil.getStandardCoin(site);
        options = options || {};

        for(let coinItem of accountCoins){
            let targetCoin;
            if(coinItem.coin){
                targetCoin = coinItem.coin;
            } else if(coinItem.symbol){
                targetCoin = symbolUtil.getSymbolParts(coinItem.symbol).targetCoin;
            } else {
                throw new Error('参数accountCoins中的数据项错误，coin和symbol不能全为空');
            }

            let itemTotal;
            if(targetCoin != standardCoin){ //如果不是本位币，则根据市场价格换算成本位币
                let symbol;
                if(coinItem.coin){
                    symbol = this._generateSymbol(targetCoin,standardCoin);
                } else {
                    symbol = coinItem.symbol;
                }
                
                itemTotal = await this.getSiteMarketValue(site,symbol,operateType,coinItem.amount,null,options.stepPercent || STEP_PERCENT,options.realPrice);
                if(Number.isNaN(itemTotal.targetTotal)){
                    return Number.NaN;
                } 

            } else { //如果是本位币，则无需换算
                itemTotal = coinItem.amount;
            }

            total = total.plus(itemTotal.targetTotal);
        }
        
        return total.toNumber();
    }

    /**
     * 在当前交易平台的市场价格下，成交一定数量数字货币需要花费的总额
     *
     * @param {String} site,交易网站
     * @param {String} symbol，交易品种. e.g btc#cny
     * @param {String} operateType
     * @param {Number} [targetCoinAmount],需要成交的数量
     * @param {Number} [settlementCoinAmount],需要成交的数量
     * @param {Number} [percent]，每档成交taker的百分比。比如有20个比特币挂40元卖出，percent=80时，那么这一档就只能最多有32个比特币卖出
     * @return {Object} 货币的数量,如果异常则返回NaN 如，{ targetTotal: Number.NaN,settlementTotal: 120 }
     */
    async getSiteMarketValue(site,symbol,operateType,targetCoinAmount,settlementCoinAmount,percent,realPrice){
        if(!targetCoinAmount && !settlementCoinAmount){
            throw new Error('参数错误,targetCoinAmount和settlementCoinAmount不能同时为空');
        }

        if(!realPrice){
            realPrice = await realTimePrice.getRealPrice(site,symbol);
        }
        if(!realPrice){
            return Number.NaN;
        }

        percent = percent || 100;

        let targetTotal = targetCoinAmount ? new Decimal(0) : Number.NaN,
            settlementTotal = settlementCoinAmount ? new Decimal(0) : Number.NaN;

        let targetAmountLeft = targetCoinAmount ? new Decimal(targetCoinAmount) : Number.NaN;
        let settlementAmountLeft = settlementCoinAmount ? new Decimal(settlementCoinAmount) : Number.NaN;

        let isEnd = false;
        let steps = (operateType == 'buy' ? realPrice.asks : realPrice.bids);
        for(let stepItem of steps){
            let stepPrice = stepItem[0],
                stepAmount = stepItem[1];
            let stepTargetAmount = new Decimal(stepAmount).times(percent).div(100),  //当前价格档位需成交的数量，并以目标币计量。初始值为价格档位的量 * 百分比
                stepSettlementAmount = stepTargetAmount.div(stepPrice); //当前价格档位需成交的数量，并以结算币计量。初始值为价格档位的量 * 百分比

            let lastTargetLeft = targetAmountLeft,
                lastSettlementLeft = settlementAmountLeft;
  
            //判断是否已经满足金额,并计算当前价格档位应当贡献的成交量(stepTargetAmount\stepSettlementAmount)
            if(!Number.isNaN(targetAmountLeft) && !Number.isNaN(settlementAmountLeft)){
                targetAmountLeft = targetAmountLeft.minus(stepTargetAmount); 
                settlementAmountLeft = settlementAmountLeft.minus(stepSettlementAmount);

                if(settlementAmountLeft.lessThanOrEqualTo(0) && targetAmountLeft.lessThanOrEqualTo(0)){
                    //let settlementAmt = settlementAmountLeft.times(stepPrice); //需要再成交的金额换算成目标货币
                    stepTargetAmount = Math.min(stepTargetAmount,lastTargetLeft);
                    stepSettlementAmount = stepTargetAmount.div(stepPrice);
                    isEnd = true;
                } else if(settlementAmountLeft.lessThanOrEqualTo(0)){
                    stepTargetAmount = lastSettlementLeft.times(stepPrice);
                    stepSettlementAmount = lastSettlementLeft;
                    isEnd = true;
                } else if(targetAmountLeft.lessThanOrEqualTo(0)){
                    stepTargetAmount = lastTargetLeft;
                    stepSettlementAmount = lastTargetLeft.div(stepPrice);
                    isEnd = true;
                }
            } else if(!Number.isNaN(targetAmountLeft) && Number.isNaN(settlementAmountLeft) ){
                targetAmountLeft = targetAmountLeft.minus(stepTargetAmount); 
                if(targetAmountLeft.lessThanOrEqualTo(0)){
                    stepTargetAmount = lastTargetLeft;
                    isEnd = true;
                }
            } else if(!Number.isNaN(settlementAmountLeft) && Number.isNaN(targetAmountLeft)){
                settlementAmountLeft = targetAmountLeft.minus(stepSettlementAmount);
                if(settlementAmountLeft.lessThanOrEqualTo(0)){
                    stepSettlementAmount = lastSettlementLeft;
                    isEnd = true;
                } 
            } 

            //当前市场价格下，已达成成交的资产价值
            if(Number.isNaN(targetAmountLeft)){
                targetTotal = targetTotal.plus(stepTargetAmount); 
            }
            if(Number.isNaN(settlementTotal)){
                settlementTotal = settlementTotal.plus(stepSettlementAmount);
            }
            
            if(isEnd){
                break;
            }
        }

        return { 
            targetTotal: targetTotal.toNumber(),
            settlementTotal: settlementTotal.toNumber()
        };
    }

}();

module.exports = position;