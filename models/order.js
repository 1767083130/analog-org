/**
 * A model for order
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

/**
 * 交易委托
 */

var orderModel = function () {
    const OrderSchema = mongoose.Schema({
        site: { type: String, required: true }, //平台名称
        
        //account: { type: Schema.ObjectId, ref: "Account" },
        userName: { type: String, required: true }, 
        isTest: { type: Boolean, "default": false },
        autoRetry: { type: Boolean, "default": true }, //失败后,是否自动尝试执行
        side: String,  //buy或sell
        type: {type: String, default: "limit"}, //“market” / “limit” / “stop” / “trailing-stop” / “fill-or-kill” / “exchange market” / “exchange limit” / 
                      //“exchange stop” / “exchange trailing-stop” / “exchange fill-or-kill”. (type starting by “exchange ” are exchange orders, others are margin trading orders)
        optionType: { type: String }, //操作类型 （call: 看涨期权  put:看跌期权）
        leverage: { type: Number, "default": 1 }, //杠杆倍数,0表示全仓
        reason: String, //原因.目前分为三种: transfer(平台差价策略产生的挂单);normal(市场交易策略产生的挂单);stoploss(止损产生的挂单);outer(外部交易平台的挂单)
        symbol: String, //cny、btc#cny、ltc、usd
        price: { type: Number, "default": 0 }, //委托价格

        amount: { type: Number, "default": 0 }, //总数量。Notice: 总数量并不是总等于consignAmount，因为有的委托没成功的时候，会分多个委托再次进行。
                                                //只是当prarentOrder为空时，两者相等

        consignAmount: { type: Number, "default": 0 }, //已委托数量
        bargainAmount: { type: Number, "default": 0 }, //已成交数量
        bargainSourceAmount: { type: Number, "default": 0 }, //已成交数量,比如说,btc#cny,表示cny的成交价
        prarentOrder: { type: Schema.ObjectId }, //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                 //那末，新的委托的prarentOrder就为此委托.一个委托至多只会发起一个新的委托
        childOrder: { type: Schema.ObjectId },   //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                 //那末，此委托的childOrder就为新委托

        bargains: [], //已成交列表
        actionId: Schema.ObjectId,//transferStrategyLogId: Schema.ObjectId,
        operateId: Schema.ObjectId, //操作Id
        outerId: String,  //外部交易网站的Id
        isSysAuto: Boolean, //是否为本系统提交

        queues:[{
            id: { type: Number },      //序列号
            name: { type :String },    //名称。如"frozen_cash"
            alias: { type: String },   //别名。如"冻结帐户金额"
            status: { type: String }, //status可能的值:wait,准备开始；success,已完成;failed,失败
            modified: { type : Date, default: Date.now() } //最近一次修改日期
        }],          //事务执行日志队列,确保每一步出错都可以重新执行或执行回滚。
                     //如，[{ id: 1,name: "frozen_cash",alias:"冻结帐户金额",status: "wait",modified: Date.now }]
                     //1、ApplyCash,用户申请提现 a、冻结资金 b、添加提现记录
                     //2、ApproveCash,批准提现  a、修改余额 b、更改提现记录的状态为“已提现” c、添加帐户变更记录
                     //3、RejectCash,拒绝提现  a、修改提现记录状态为拒绝 b、修改冻结资金
                     //4、Receipt,收款 a、修改余额 b、添加帐户变更记录 c、修改支付流程状态
        status: { type: String,default: "wait" }, //status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                                                  //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                                                  //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
        //previousOrder: { type: Schema.ObjectId },//前置交易
        //nextOrder: { type: Schema.ObjectId }, //后置交易

        storeId : { type: Number, default: 0 },                // 仓位ID
        processedMoney : { type: Number, default: 0 },         // 已处理的金额数量
        margin : { type: Number, default: 0 },       // 订单冻结保证金
        processedPrice : { type: Number, default: 0 },         // 成交价格
        timeInForce: { type: String, default: "GoodTillCancel" } , //成交时间限制 "GoodTillCancel"

        consignDate: Date, //委托时间
        created: { type: Date, "default": Date.now() }, //创建时间
        modified: { type: Date, "default": Date.now() } //最近修改时间
    });

     /**
     * Methods
     */
    OrderSchema.methods = {
    }
    
    /**
     * Statics
     */

    OrderSchema.statics = {

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

        generateGroupKey: function () {
            return "xxxxxxxxxxxx4xxxyxxxyxxxxx".replace(/[xy]/g,
            function (c) {
                var r = Math.random() * 16 | 0,
                v = c == "x" ? r : r & 3 | 8;
                return v.toString(16)
            })
        }
    };

    OrderSchema.plugin(paginate);
    return mongoose.model('Order', OrderSchema);
};

module.exports = new orderModel();
