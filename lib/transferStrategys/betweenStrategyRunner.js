'use strict';
const BaseStrategyRunner =  require('./BaseStrategyRunner');

/**
 * btctrade交易网站接口实现
 */
class BetweenStrategyRunner extends BaseStrategyRunner {
    constructor(){
        super(); 
    }


    watchLog(log) {
        if([].indexOf(log.status) != -1){
            return;
        }

        var strategy = log.strategy,
            operates = log.operates;
        var order = getRes(log.strategy, realPrice, log);

        if (order.amount > 0) {
            if (strategy.orderType == 0 &&  ( (log.amount - order.amount) * 100 / order.amount > strategy.standAmount
                                                || (log.price - order.price) * 100 / order.price > strategy.standPrice)
                   || strategy.orderType != 0 &&  ( (log.amount - order.amount) * 100 / order.amount > strategy.standAmount
                                                || (log.price - order.price) * 100 / order.price > strategy.standPrice)
            ){
                //需要重新发起请求
            }
        } else {
            //已经不满足条件，需要撤销

        }
    }

    getMarketConditionResult(strategy, realPrice, log) {
        var upAmount = 0.001;

        var b1 = realPrice.bids,
            s1 = realPrice.asks;

        //必须排除自家的
        var exceptItem = {

        };

        var a = (strategy.orderType == 0 ? s1 : b1);
        var b = (strategy.orderType == 0 ? b1 : s1);
        var total = 0, p;
        for (var i = 0; i < a.length; i++) {
            total += a[i][1];
            if (strategy.ignoreAmount < total) {
                p = i;
                break;
            }
        }
        var p1 = p ? a[p][0] : a[0][0];
        p1 = (strategy.orderType == 0 ? p1 - upAmount : p1 + upAmount);

        var marketTotal = 0, start = false;
        total = 0, p = 0;
        for (var j = 0; j < b.length; j++) {
            total += b[j][1];
            if (strategy.ignoreAmount >= total) {
                var profine1 = Math.abs(b[j][0] - p1) * 100 / b[j][0];
                if (profine1 >= strategy.minProfine) {
                    marketTotal += b[j][1];
                }
            } else {
                if (!start) {
                    p = j;
                }
                start = true;
            }

            if (start) {
                var t = b[p][0];
                var stepLoss = Math.abs(b[j][0] - t) * 100 / t;
                if (stepLoss <= strategy.maxLoss) {
                    marketTotal += b[j][1];
                }
            }
        }


        var p2 = start ? b1[p][0] : b1[0][0];
        p2 = (strategy.orderType == 0 ? p2 + upAmount : p2 - upAmount);
        var total2 = marketTotal * strategy.turnPercent / 100;
        var order = {
            amount: total2,
            price: p2
        };

        return order;
    }

}

module.exports = BetweenStrategyRunner;