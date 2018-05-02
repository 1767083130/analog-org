/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Decimal = require('decimal.js');

/**
 * 合约资产信息
 */
var futuresBalanceModel = function () {
    const FuturesBalanceSchema = mongoose.Schema({
        site: { type: String, required: true }, //平台名称
        userName: { type: String, required: true }, 
        isTest: { type: Boolean,default: false }, //是否为测试帐户
        isValid: { type: Boolean, default: true }, //是否有效
        isLocked: { type: Boolean, default: false }, //是否locked

        profitLoss: { type: Number, default: 0 },  // 本周平仓盈亏
        masterHoldProfitLoss: { type: Number, default: 0 },  // 全仓仓位持仓盈亏
        masterUsedMargin: { type: Number, default: 0 },    // 全仓仓位占用保证金
        status: { type: Number, default: 0 },       // 账户状态
        usedMargin: { type: Number, default: 0 },    // 账户使用保证金
        holdProfitLoss : {type: Number, default: 0 },   // 账户持仓盈亏
        masterDynamicRights : {type: Number, default: 0 },        // 全仓仓位动态权益
        slaveUsedMargin: {type: Number, default: 0 },        // 所有分仓使用保证金
        fee: { type: Number, default: 0 },                  // 本周手续费
        totalProfitLoss: {type: Number, default: 0 },              // 账户总平仓盈亏
        totalFee: {type: Number, default: 0 },             // 账户总手续费
        riskRate: {type: String, default: "0%" },            // 账户风险率
        dynamicRights: {type: Number, default: 0 },          // 账户动态权益
        slaveHoldProfitLoss: {type: Number, default: 0 },          // 所有分仓持仓盈亏
        staticRights: {type: Number, default: 0 },              // 账户静态权益
        margin: { type: Number, default: 0 },                 // 账户保证金余额
        availableMargin: {type: Number, default: 0 },       // 账户可用保证金
        frozenMargin: {type: Number, default: 0 },             // 冻结保证金

        availableMarginQuarter2: {type: Number, default: 0 },        // 季合约可用保证金
        availableMarginWeek: {type: Number, default: 0 },    // 周合约可用保证金
        availableMarginWeek2: {type: Number, default: 0 },         // #周合约可用保证金
        masterHoldProfitLossWeek: {type: Number, default: 0 },     // 全仓账户周合约持仓盈亏
        masterHoldProfitLossWeek2: {type: Number, default: 0 },    // 全仓账户#周合约持仓盈亏
        masterHoldProfitLossQuarter2: {type: Number, default: 0 },           // 全仓账户季合约持仓盈亏
        closeProfitLossWeek: {type: Number, default: 0 },          // 周合约平仓盈亏
        closeProfitLossWeek2: {type: Number, default: 0 },         // #周合约平仓盈亏
        closeProfitLossQuarter2: {type: Number, default: 0 },      // 季合约平仓盈亏
        feeWeek: {type: Number, default: 0 },           // 周合约手续费
        feeWeek2: {type: Number, default: 0 },                     // #周合约手续费
        feeQuarter2: {type: Number, default: 0 },                  // 季合约手续费
        holdProfitLossWeek: {type: Number, default: 0 },           // 账户周合约持仓盈亏
        holdProfitLossWeek2: {type: Number, default: 0 },          // 账户#周合约持仓盈亏
        holdProfitLossQuarter2: {type: Number, default: 0 },       // 账户季合约持仓盈亏

        created: { type: Date, "default": Date.now() },
        modified: { type: Date, "default": Date.now() } //最近一次更新时间
    });

     /**
     * Methods
     */
    FuturesBalanceSchema.methods = {

        /*
        * 获取货币可用的数量。可用数量 = 总量 - 冻结额度 - 提现额度
         * 
         * @param {String} coin 货币
         * @returns {Number} 货币可用的数量 
         */
        getAvailable: function(coin){
            var item = getCoinItem(this.coins,coin);
            if(!item){
                return 0;
            }
            return new Decimal(item.total).minus(item.frozen).toNumber();
        },

        /**
         * 获取货币的持仓总量，包括冻结的和未冻结的
         * 
         * @param {String} coin 货币
         * @returns {Number} 持仓总量 
         */
        getTotal: function(coin){
            var total = 0;
            var item = getCoinItem(this.coins,coin);
            if(item){
                total = item.total;
            }

            return total;
        },

        /**
         * 获取货币冻结的总量
         * 
         * @param {String} coin 货币
         * @returns {Number} 冻结总量 
         */
        getFrozen: function(coin){
            var frozen = 0;
            var item = getCoinItem(this.coins,coin);
            if(item){
                frozen = item.frozen;
            }

            return frozen;
        },
        
        /**
         * 获取货币被申请提现的总量
         * 
         * @param {String} coin 货币
         * @returns {Number} 货币被申请提现的总量 
         */
        getLoan: function(coin){
            var loan = 0;
            var item = getCoinItem(this.coins,coin);
            if(item){
                loan = item.loan;
            }

            return loan;
        },

        /**
         * 获取货币被申请提现的总量
         * 
         * @param {String} coin 货币
         * @returns {Number} 货币被申请提现的总量 
         */
        getApply: function(coin){
            var apply = 0;
            var item = getCoinItem(this.coins,coin);
            if(item){
                apply = item.apply;
            }

            return apply;
        }

    }
    
    /**
     * Statics
     */
    FuturesBalanceSchema.statics = {

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

        /**
         * 获取用户的有效账户列表
         * 
         * @param {String} userName 用户名
         * @param {options} 帅选条件如{isTest: true }
         */
        getUserAccounts: function(userName,isTest){
            isTest = isTest || false;
            return this.find({ userName: userName, isValid: true, isTest: isTest })
                .exec();
        },

        getUserAccount: function(userName,site,isTest){
            isTest = isTest || false;
            return this.findOne({ userName: userName, site: site, isValid: true, isTest: isTest })
                .exec();
        }
    };

    let getCoinItem = function(items,coin){
        for(let item of items){
            if(item.coin == coin){
                return item;
            }
        }

        return null;
    }

    return mongoose.model('FuturesBalance', FuturesBalanceSchema);
};


module.exports = new futuresBalanceModel();
