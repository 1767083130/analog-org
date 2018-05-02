/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Decimal = require('decimal.js');

var accountModel = function () {
    const AccountSchema = mongoose.Schema({
        site: { type: String, required: true }, //平台名称
        userName: { type: String, required: true }, 
        isTest: { type: Boolean,default: false }, //是否为测试帐户
        isValid: { type: Boolean, default: true }, //是否有效
        isLocked: { type: Boolean, default: false }, //是否locked

        totalAssets: Number,
        netAssets: Number,
        coins: [{
            coin: { type: String }, //如 btc、cny 注意区分与symbol的区别 (btc,usd,cny,ltc,bch,eth,etc...)
            type: { type: String,default: "exchange" }, //Wallet name (exchange, margin, funding)
            total: { type: Number,default: 0 }, //总额 = 可用数 + 冻结数
            frozen: { type: Number,default: 0 }, //冻结
            unsettledInterest:  { type: Number,default: 0 }, //未结算利息
            loan: { type: Number,default: 0 }, //申请借贷
            cost: { type: Number,default: 0 }  //成本
        }],

        created: { type : Number, "default": +new Date() },
        modified: { type : Number, "default": +new Date() } //最近一次更新时间

    });

     /**
     * Methods
     */
    AccountSchema.methods = {

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
    AccountSchema.statics = {

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

    return mongoose.model('Account', AccountSchema);
};


module.exports = new accountModel();
