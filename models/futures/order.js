/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Decimal = require('decimal.js');

/**
 * 合约资产信息
 */
var futuresOrderModel = function () {
    const FuturesOrderSchema = mongoose.Schema({
        site: { type: String, required: true }, //平台名称
        userName: { type: String, required: true }, 
        isTest: { type: Boolean,default: false }, //是否为测试帐户
        isValid: { type: Boolean, default: true }, //是否有效
        isLocked: { type: Boolean, default: false }, //是否locked

        id : String,            // 订单ID
        fee : { type: Number, default: 0 },             // 手续费
        side: { type: String, required: true }, //交易类型 buy(买入或者期货中的开仓)或sell(卖出或者期货中的平仓)。当action=trade时有效
        optionType: { type: String, required: true }, //操作类型 （call: 看涨期权  put:看跌期权）
       
        price : { type: Number, default: 0 },       // 订单价格
        status : { type: Number, default: 0 },         // 订单状态 （0、未成交 1、部分成交 2、已成交 3、撤单 7、队列中）
        lastTime : { type : Date, "default": Date.now() },      // 最后处理时间
        amount : { type: Number, default: 0 },        // 订单比特币数量
        money : { type: Number, default: 0 },               // 订单金额数量
        orderTime : { type : Date, "default": Date.now() },     // 下单时间
        lever : { type: Number, default: 0 },                  // 杠杆倍数
        storeId : { type: Number, default: 0 },                // 仓位ID
        processedMoney : { type: Number, default: 0 },         // 已处理的金额数量
        processedAmount : { type: Number, default: 0 },        // 已处理比特币数量
        margin : { type: Number, default: 0 },       // 订单冻结保证金
        processedPrice : { type: Number, default: 0 },         // 成交价格

        created: { type : Date, "default": Date.now() },
        modified: { type : Date, "default": Date.now() } //最近一次更新时间

    });

     /**
     * Methods
     */
    FuturesOrderSchema.methods = {
    }
    
    /**
     * Statics
     */
    FuturesOrderSchema.statics = {

        /**
        * Find article by id
        *
        * @param {ObjectId} id
        * @api private
        */
        load: function (_id) {
            return this.findOne({ _id })
                .exec();
        }
    };

    return mongoose.model('FuturesOrder', FuturesOrderSchema);
};


module.exports = new futuresOrderModel();
