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

            id: Number, //从1开始记数。1,2,3,4,5 ...
            site: String, //平台名称

            action: String,  //操作类型。分为 trade(成交)、transfer（转币）两种
            side: String, //交易类型 buy(买入或者期货中的开仓)或sell(卖出或者期货中的平仓)。当action=trade时有效
            leverage: { type: Number, "default": 1 }, //杠杆倍数
            transferSource: String, //移动路径源交易所,当action=transfer时有效，如 transferSource = 'huobi',transferTarget = 'btctrade'，表示从huobi移向btctrade
            transferTarget: String, //移动路径目标交易所

            batchWait: { type: Number, default: 0 }, //如果要分批,需要等待的时间
            batchMin: { type: Number, default: 0 },  //执行分批的最小额度.如果为0,则表示不能分批

            minOrderAmount: {type: Number,default: 0}, //最低额度。只可能为正数
            isPostOnly: {type: Boolean,default: false }, //订单是否为PostOnly
            symbol: String, //btc#cny、btc、ltc、usd。 注意，当action=trade时，为btc#cny; 当action=transfer时，为btc
            previousOperate: { type: Number, default: 0 },
            nextOperate: { type: Number, default: 0 }, //下一步操作ID。如果为0，则不进行下一步操作
            orderAmount: String, //>0时，为多仓； < 0时，为空仓
                                 //这个由策略中设定。比如 5 或者 5%,数字表示多少个，百分比表示账户总额中的百分之多少
                                 //也可以为 min(btctrade.btc#cny.buy.amount * 20%,btctrade.btc.account.available * 50%)
            auto: { type: Boolean, default: true }, //是否自动执行
            validAccount: { type: Boolean, default: false } //如果id不为1时，是否在运行策略时就需要验证账户余额（为1时一定会验证）
        }],
        priority: { type: Number, default: 0 }, //优先级 
        desc: String,

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

