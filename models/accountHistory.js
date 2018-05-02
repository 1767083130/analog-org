/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var accountHistoryModel = function () {
    const AccountHistorySchema = mongoose.Schema({
        site: { type: String },  
        userName: { type: String },
        coin: { type: String },
        
        total: { type: Number,default: 0 }, //总额 = 可用数 + 冻结数
        frozen: { type: Number,default: 0 }, //冻结
        loan: { type: Number,default: 0 }, //申请借贷
        apply: { type: Number,default: 0 }, //交易中的金额

        exchangeType: { type: String }, //"trade"\"transfer"\"other"
        exchangeId: Schema.ObjectId, //订单或转币ID
        changeType: { type: String }, //在什末情况下更新账户.总共有3种：create（创建委托）,bargain（委托成交）,cancel(取消委托),sync_accounts(同步账户)。

        operateId: Schema.ObjectId, //操作Id
        created: { type: Date, default: Date.now }
    });


     /**
     * Methods
     */
    AccountHistorySchema.methods = {

    }
    
    /**
     * Statics
     */

    AccountHistorySchema.statics = {

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

    return mongoose.model('AccountHistory', AccountHistorySchema);
};

module.exports = new accountHistoryModel();
