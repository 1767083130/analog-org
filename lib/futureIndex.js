'use strict';

const mongoose = require('mongoose');
const BothApi = require('./apiClient/bothApi');
const FuturesApi =  require('./apiClient/futuresApi');
const apiConfigUtil = require('./apiClient/apiConfigUtil');
const symbolUtil = require('./utils/symbol');

const FutureIndex_ValidTime = 1 * 1000; //api即时市场信息有效时长。 1秒
let _futureIndexs = []; //缓存一定时间内的市场价格

let futureIndex = new class{

    /** 
     * 同步市场行情信息
     * 
     * @param {Function} stepCallback 获取成功后的回调函数
     */
    syncFutureIndexs(stepCallback){
        let sites = apiConfigUtil.getPlatforms();
        for(var siteItem of sites){
            if(['okex','bitvc'].indexOf(siteItem.site) == -1){ //todo ['chbtc','bitvc']  应当去掉
                continue;
            }

            for(var item of siteItem.futureIndexs){
                this._getFutureIndex(siteItem.site, item,function(err,res){
                    if(err || !res.isSuccess){
                        if(!err){
                            err = new Error(`从交易网站(${siteItem.site})获取指数价格(${item})失败`);
                        }

                        return stepCallback && stepCallback(err);
                    }

                    stepCallback && stepCallback(err);
                });
            }
        }
    }

    /**
     * 获取合约的指数价格
     * @param {String} site 如 okex
     * @param {String} symbol e.g "btc"
     */
    async getFutureIndex(site,symbol){
        //let symbolInfo = symbolUtil.getFullSymbol(symbol,site);
        let checkTime = function(time){
            var interal = (+new Date()) - time.getTime();
            return interal < FutureIndex_ValidTime;
        }

        let index;
        //先从缓存中读取
        for(var i = _futureIndexs.length - 1; i >= 0; i--){
            let item = _futureIndexs[i];
            if(item.symbol == symbol && item.site == site ){
                if(checkTime(item.time)){
                    index = item;
                    break;
                } else {
                    break;
                }
            }
        }

        //没有获取到，从数据库中读取 //TODO
        // if(!index){
        //     let query = { site: site, symbol: symbol };
        //     let realTimePrice = await RealTimePrice.find(query).sort({time: -1}).limit(1);
        //     if(realTimePrice && realTimePrice.length > 0  && checkTime(realTimePrice[0].time)){
        //         index = realTimePrice[0];
        //     }
        // }

        //还没有获取到，从交易网站中获取
        if(!index){
            let realPrices = await this._getFutureIndex(site,symbol);
            if(realPrices && realPrices.length > 0){
                index = realPrices[0];
            }
        }

        return index;
    }

    _getFutureIndex(site,symbol,callback){
        let futuresApi = new FuturesApi(site);
        futuresApi.getIndexPrice(symbol,function(err,res){
            if(err || !res.isSuccess){
                if(!err){
                    err = new Error(`从交易网站(${site})获取行情失败`);
                }

                return callback && callback(err);
            }
            
            try{
                //将行情信息重新组织，放置到一个新的数组中,这样更方便后续操作
                var detail = {
                    time: new Date(),
                    site: site, 
                    symbol: symbol,
                    price: res.price
                };
                callback && callback(err,detail);
                this.cacheFutrueIndex(detail);
            } catch(e) {
                //忽略错误
                callback && callback(e);
            }
        }.bind(this));
    }

    /**
     * 缓存合约的指数价格
     * 
     * @param {Object} detail 实时行情数据，e.g { time: new Date(),site: "houbi",symbol:"btc#cny",bids:[[1234,1]],asks: bids:[[1235,12]]}
     */
    cacheFutrueIndex(detail){
        let now = new Date(), lastRealPrice;
        let lastRealPriceIndex = _futureIndexs.findIndex(function(value){
            return value.site == detail.site && value.symbol == detail.symbol;
        });
        if(lastRealPriceIndex > -1){
            lastRealPrice = _futureIndexs[lastRealPriceIndex]
        }
        
        let detailCopy = Object.assign({}, detail);
        detailCopy.symbol = detailCopy.symbol.toLowerCase();
        detailCopy.site = detailCopy.site.toLowerCase();

        if(lastRealPrice){
            detailCopy.syncTime = lastRealPrice.syncTime;
            detailCopy.syncHistoryTime = lastRealPrice.syncHistoryTime;
            lastRealPrice = detailCopy;
            _futureIndexs[lastRealPriceIndex] = lastRealPrice;
        } else {
            detailCopy.syncTime = new Date();
            detailCopy.syncHistoryTime = new Date();
            _futureIndexs.push(detailCopy);
        }

        // if(!lastRealPrice || !lastRealPrice.syncTime || (lastRealPrice.syncTime < now && +now - lastRealPrice.syncTime >= RealPrice_SyncInterval)){
        //     RealTimePrice.findOneAndUpdate(
        //         { site: detailCopy.site,symbol: detailCopy.symbol },  //, time: {$lt: detail.time } 
        //         detailCopy, 
        //         { upsert: true, sort: {time: -1} },
        //     function(err,doc){
        //         if(err){
        //             return console.error(err);
        //         }
        //     });

        //     if(lastRealPrice){
        //         lastRealPrice.syncTime = new Date();
        //     }
        // }

        // if(!lastRealPrice || !lastRealPrice.syncHistoryTime || (lastRealPrice.syncHistoryTime < now && +now - lastRealPrice.syncHistoryTime >= RealPriceHistory_SyncInterval)){
        //     let historyItem = new RealTimePriceHistory(detailCopy);
        //     historyItem.save(function(err){
        //         if(err){
        //             console.error(err);
        //         }
        //     });

        //     if(lastRealPrice){
        //         lastRealPrice.syncHistoryTime = new Date();
        //     }
        // }
    }

}();

module.exports = futureIndex;

