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
        side: String,  //可能的值：'buy'、'sell'。这个字段需要特别注意，buy对应的是建仓（可能建多仓或空仓），sell对应的是平仓（可能平多仓或空仓）
        type: {type: String, default: "limit"},  //订单类型，现在暂时支持exchange、limit两种，分别是现货和保证金模式
        leverage: { type: Number, "default": 1 }, //杠杆倍数,0表示全仓
        reason: String, //原因.目前分为三种: transfer(平台差价策略产生的挂单);normal(市场交易策略产生的挂单);stoploss(止损产生的挂单);outer(外部交易平台的挂单)
        symbol: String, //cny、btc#cny、ltc、usd
        price: { type: Number, "default": 0 }, //最新的委托价格
        orgPrice: { type: Number, "default": 0 }, //最原先的委托价格
        avgPrice: { type: Number, "default": 0 }, //成交平均价格

        amount: { type: Number, "default": 0 }, //总数量。>0时，为多仓； < 0时，为空仓
                                                //Notice: 总数量并不是总等于consignAmount，因为有的委托没成功的时候，会分多个委托再次进行。
                                                //只是当prarentOrder为空时，两者相等
        consignAmount: { type: Number, "default": 0 }, //已委托数量。>0时，为多仓； < 0时，为空仓
        bargainAmount: { type: Number, "default": 0 }, //已成交数量。>0时，为多仓； < 0时，为空仓
        bargainSourceAmount: { type: Number, "default": 0 }, //已成交数量,比如说,btc#cny,表示cny的成交价。>0时，为多仓； < 0时，为空仓
        prarentOrder: { type: Schema.ObjectId }, //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                 //那末，新的委托的prarentOrder就为此委托.一个委托至多只会发起一个新的委托
        childOrder: { type: Schema.ObjectId },   //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                 //那末，此委托的childOrder就为新委托
        bargains: [], //已成交列表
        changeLogs: [{ type: Schema.Types.Mixed }], //变动记录,主要供测试时使用
        actionId: Schema.ObjectId,//transferStrategyLogId: Schema.ObjectId
        operateId: Number, //操作Id
        strategyPlanLogId: { type: Schema.ObjectId }, //策略计划_id
        
        outerId: String,  //外部交易网站的Id
        isSysAuto: Boolean, //是否为本系统提交

        isTest: { type: Boolean, "default": false },
        autoRetry: { type: Boolean, "default": true }, //失败后,是否自动尝试执行
        autoRetryFailed: { type: Number, "default": 0 }, //已自动尝试执行次数
        autoRetryTime: { type: Date }, //最近一次重试时间
        waitRetry: { type: Boolean,default: false }, //是否正在等待自动尝试执行
        waitCreateChild: { type: Boolean, default: false }, //是否被撤销后，需要生成新的委托，一般在接收到第三方交易网站发送的委托状态时进行处理
        waitRetryPrice: { type: Number },

        exceptions:[{
            name: { type :String },    //名称。如"retry",重试； “cancel”，撤销；“consign”，委托; "maxLossPercent"，超最大最大能容忍的亏损百分比 
            alias: { type: String },   //别名。如"冻结帐户金额"
            message: { type: String },
            Manual: { type: Boolean,default: true }, //是否需要人工处理
            status: { type: String }, //status可能的值:wait,准备开始；success,已完成;failed,失败
            timestamp: { type : Number } //最近一次修改日期
        }], 
        apiOrder: { type: Schema.Types.Mixed },  
        apiStatus: { type: String }, //通过api获取到的最新委托状态，目的是为了防止重复处理（在处理委托时，可能会出现脏数据的问题，导致提交重复数据），导致仓位出现问题
        status: { type: String,default: "wait" }, //status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                                                  //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                                                  //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
        desc: { type: String }, //描述说明
        isHidden: { type: Boolean, "default": false }, //是否为隐藏单
        isPostOnly:  { type: Boolean, "default": false }, //当type=limit时有效。感觉是fill or kill的反面，也就是说，如果提交了post-only单，且这个单子会立刻成交的话，就自动撤单（或者移开一个最小价位）。只有这个单子能挂上去不被立刻成交的时候才会下单。
        consignDate: Date, //委托时间
        created: { type: Date, "default": Date.now() }, //创建时间
        modified: { type: Date, "default": Date.now() }, //最近修改时间
        syncTimestamp: { type: Date }, //最近一次从第三方交易平台同步的时间

        // /** 下面几个字段并没有使用到 */
        // storeId : { type: Number, default: 0 },                // 仓位ID
        // processedMoney : { type: Number, default: 0 },         // 已处理的金额数量
        // margin : { type: Number, default: 0 },       // 订单冻结保证金
        // processedPrice : { type: Number, default: 0 },         // 成交价格
        // timeInForce: { type: String, default: "GoodTillCancel" } , //成交时间限制 "GoodTillCancel"
    },{
        usePushEach: true
    });

     /**
     * Methods
     */
    OrderSchema.methods = {
       /*
        * 获取货币可用的数量。可用数量 = 总量 - 冻结额度 - 提现额度
         * 
         * @param {String} coin 货币
         * @returns {Number} 货币可用的数量 
         */
        isEnded: function(){
            return ['canceled','success','failed'].indexOf(this.apiStatus) != -1;
        },
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
