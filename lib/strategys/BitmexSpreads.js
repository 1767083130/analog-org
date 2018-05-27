'use strict';

const mongoose = require('mongoose');
const StopLoss = mongoose.model('StopLoss');
const StopLossLog = mongoose.model('StopLossLog');
const ClientIdentifier  = mongoose.model('ClientIdentifier');

const realTimePrice = require('../realTimePrice');
const order = require('../order');
const transfer = require('../transfer');
const account = require('../account');
const Decimal = require('decimal.js');

/**
 * 交易网站Bitmex息差套取策略
 */
class BitmexSpreads{
    constructor(){
    }

    /**
     * 运行策略
     */
    async runStrategy(strategy,stepCallBack){
       
    }

    /**
     * 回测
     *
     * 
     */
    async backTestStrategy(strategy){
       return false;
    }

    /**
     * 订单状态变更处理函数
     * @param {Object} e,参数，至少要有两个字段.e.g. 
     *  { order: refreshOrder, //变更后的订单
     *     changeAmount: 23 } //变更的额度
     * 
     */
    async onOrderStatusChanged(e){
        if(e.order.reason != 'stoploss'){
            return;
        }
    }

    async onOrderDelayed(e){
        if(e.order.reason != 'stoploss'){
            return;
        }
    }
}

module.exports = BitmexSpreads;

