/**
 * A model for transfer
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var transferModel = function () {
    const TransferSchema = mongoose.Schema({
        source: { type: String, required: true }, //移动路径源交易所
        target: { type: String, required: true }, //移动路径目标交易所
        //account: { type: Schema.ObjectId, ref: "Account" },
        userName: { type: String, required: true }, 
        isTest: { type: Boolean, "default": false },

        reason: String, //原因
        coin: String, //cny、btc、ltc、usd
        consignDate: Date, //委托时间
        consignAmount: { type: Number, "default": 0 }, //已委托数量
        prarentTransfer: { type: Schema.ObjectId }, //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                 //那末，新的委托的prarentTransfer就为此委托.一个委托至多只会发起一个新的委托
        childTransfer: { type: Schema.ObjectId },   //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                 //那末，此委托的childTransfer就为新委托

        actionId: Schema.ObjectId, 
        operateId: Schema.ObjectId, //操作Id
        accountAmount: { type: Number, "default":0 }, //转币前的帐户总额。当action=transfer时有效
        isSysAuto: Boolean,
        outerId: String,  //外部交易网站的Id
        status: { type: String,default: "wait" }, //status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                                                  //part_success,部分成功; canceled: 已人工取消；
                                                  //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
        created: { type: Date, "default": Date.now() }, //创建时间
        modified: { type: Date, "default": Date.now() } //最近修改时间
    });

     /**
     * Methods
     */
    TransferSchema.methods = {
    }
    
    /**
     * Statics
     */

    TransferSchema.statics = {
    };

    TransferSchema.plugin(paginate);
    return mongoose.model('Transfer', TransferSchema);
};

module.exports = new transferModel();
