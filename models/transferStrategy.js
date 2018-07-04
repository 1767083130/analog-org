/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var transferStrategyModel = function () {
    const TransferStrategySchema = mongoose.Schema({
        userName: { type: String, required: true }, 
        isTest: { type: Boolean },
        openType: { type: String, default: "private" },
        planId: { type: Schema.ObjectId }, //策略计划_id
        
        priceRange: Number, //未成功的交易价格容忍度，如0.5，表示0.5%的价差
        lastRunTime:{ type: Date, default: Date.now() },  //上次运行时间
        auto: { type: Boolean,default: true },
        name: String,
        //itemId: { type: Schema.ObjectId },
        isSimple: Boolean,  //是否为简单模式
        isValid: {type: Boolean,default: true},
        conditions: [String], //需要满足的条件
        strategyType: { type: String, default: "normal" }, //策略类型。现在支持between、normal两种
        operates: [{
            id: { type: Number, required: true }, //从1开始记数。1,2,3,4,5 ...
            site: String, //平台名称

            action: { type: String, default: 'trade' },  //操作类型。分为 trade(成交)、transfer（转币）两种
            side: String, //交易类型 buy(买入或者期货中的开仓)或sell(卖出或者期货中的平仓)。当action=trade时有效
                          //这个字段和orderAmount字段结合起来确定看涨还是看跌
                          //(1) side = 'buy'时  a) orderAmount < 0 时看跌； b) orderAmount > 0时看涨
                          //(2) side = 'sell'时  a) orderAmount > 0 时看跌；b) orderAmount < 0时看涨
            type: { type: String,default: 'margin' },  //订单类型，现在暂时支持exchange、limit两种，分别是现货和保证金模式
            leverage: { type: Number, "default": 1 }, //杠杆倍数
            transferSource: String, //移动路径源交易所,当action=transfer时有效，如 transferSource = 'huobi',transferTarget = 'btctrade'，表示从huobi移向btctrade
            transferTarget: String, //移动路径目标交易所

            batchWait: { type: Number, default: 0 }, //如果要分批,需要等待的时间
            batchMin: { type: Number, default: 0 },  //执行分批的最小额度.如果为0,则表示不能分批

            minStepAmount: {type: Number,default: 0}, //最低额度。只可能为正数
            isPostOnly: {type: Boolean,default: false }, //订单是否为PostOnly
            symbol: String, //btc#cny、btc、ltc、usd。 注意，当action=trade时，为btc#cny; 当action=transfer时，为btc
            previousOperate: { type: Number, default: 0 },
            nextOperate: { type: Number, default: 0 }, //下一步操作ID。如果为0，则不进行下一步操作
            orderAmount:  { type: Number, required: true }, //相比第一步，执行数量的比例。 >0时，为多仓； < 0时，为空仓
                                 //比如，totalAmount = 100, 那么，执行第一步的总量orderAmount为100，执行第二步时，
                                 //（1）如果币种不同，当orderAmount=20时，表示上一步每执行1个，这一步就需要执行20个
                                 //这个字段和side字段结合起来确定看涨还是看跌.具体见side字段的说明
            auto: { type: Boolean, default: true }, //是否自动执行
            validAccount: { type: Boolean, default: false } //如果id不为1时，是否在运行策略时就需要验证账户余额（为1时一定会验证）
        }],
        totalAmount: { type: Number,default: 0, required: true }, //策略首步需要执行总量。 -1，表示直到满仓为止
        stepAmount: { type: Number }, //每一步执行的数量
        priority: { type: Number, default: 0 }, //优先级 
        desc: String,

        relatedStrategy: { type: Schema.ObjectId }, //关联的策略
        direction: { type: Number }, //1表示正方向，其余数值表示反方向

        created: { type : Date, "default": Date.now() },
        modified: { type : Date, "default": Date.now() }

    });

     /**
     * Methods
     */
    TransferStrategySchema.methods = {


    }
    
    /**
     * Statics
     */
    TransferStrategySchema.statics = {

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
        getUserStrategy: function(userName){
            return this.find({ userName: userName }).exec();
        }
    };

    TransferStrategySchema.plugin(paginate);
    return mongoose.model('TransferStrategy', TransferStrategySchema);
};


module.exports = new transferStrategyModel();

