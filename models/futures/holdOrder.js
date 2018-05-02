/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Decimal = require('decimal.js');

/**
 * 合约资产信息
 */
var futuresHoldOrderModel = function () {
    const FuturesHoldOrderSchema = mongoose.Schema({
        site: { type: String },
        userName: { type: String },

        id: { type: String },   // 持仓ID
        symbol: { type: String },
        optionType: { type: String, required: true }, //操作类型 （call: 看涨期权  put:看跌期权）

        liquidatePrice: { type: Number },  // 分仓爆仓价格
        price: { type: Number },      // 仓位平均价格
        riskRate: { type: Number },   // 风险率
        status: { type: String,default: "normal" }, // 仓位状态（normal: 正常 lose: 爆仓）
        dynamicRights: { type: Number,default: 0 },  // 分仓动态权益
        money: { type: Number,default: 0 },       // 持仓金额
        closeMoney: { type: Number,default: 0 },  // 可平金额
        holdProfitLoss: { type: Number,default: 0 },  // 持仓盈亏
        usedMargin: { type: Number,default: 0 },     // 仓位占用保证金
        storeId: { type: Number,default: 0 },        // 仓位ID （0 全仓 1-10 分仓）
        modified: { type: Date,default: new Date() },  // 最后操作时间
        created: { type: Date,default: new Date() }
    });

    /**
     * Methods
     */
    FuturesHoldOrderSchema.methods = {

    }

    /**
     * Statics
     */
    FuturesHoldOrderSchema.statics = {
       /**
        * Find HoldOrder by id
        *
        * @param {ObjectId} id
        * @api private
        */
        load: function (_id) {
            return this.findOne({ _id })
                .exec();
        }
    }

    return mongoose.model('FuturesHoldOrder', FuturesHoldOrderSchema);
}

module.exports = new futuresHoldOrderModel();
