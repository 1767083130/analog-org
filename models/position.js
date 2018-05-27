/**
 * A model for position
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');
const Decimal = require('decimal.js');

var positionModel = function () {
    const PositionSchema = mongoose.Schema({
        site: { type: String, required: true }, //平台名称
        userName: { type: String, required: true }, 
        isTest: { type: Boolean, "default": false },
       
        contractId: { type: String }, // 合约id
        contractName: { type: String }, // 合约名称
        avgPrice: { type: String }, // 开仓均价
        balance: { type: String }, // 合约账户余额
        bondFreez: { type: String }, // 当前合约冻结保证金
        costPrice: { type: String },// 开仓价格
        eveningUp: { type: String }, // 可平仓量
        forcedPrice: { type: String }, // 强平价格
        positionType: { type: String }, // 仓位 1多仓 2空仓
        profitReal: { type: String }, // 已实现盈亏
        fixMargin: { type: String }, // 固定保证金
        holdAmount: { type: String }, // 持仓量
        unit: { type: String }, //单位。格式为“数量_币种”,e.g 10_usd,表示一个单位为10美元，当持仓量为10时，那么整个仓位为100usd
        leverRate: { type: String }, // 杠杆倍数
        positionId: { type: String },// 仓位id
        symbol: { type: String },  // btc#usd   ltc#usd   eth#usd   etc#usd   bch#usd
        status: { type: String, "default": "active" }  //状态，可选值：closed,active
    });

     /**
     * Methods
     */
    PositionSchema.methods = {

    }
    
    /**
     * Statics
     */

    PositionSchema.statics = {

        /**
        * Find article by id
        *
        * @param {ObjectId} id
        * @api private
        */
        load: function (_id) {
            return this.findOne({ _id })
                .exec();
        },

    };

    PositionSchema.plugin(paginate);
    return mongoose.model('position', PositionSchema);
};

module.exports = new positionModel();
