'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var exchangeExceptionModel = function () {
    const ExchangeExceptionSchema = mongoose.Schema({
        userName: String,
        exchangeType: String, //市场行为类型. transfer,转币 trade,交易

        site: String,
        actionId: { type: Schema.ObjectId }, //orderId or transferId
        operateId: { type: Number }, //transferStrategyLog.operate.id
        status: { type: Number, "default": 0 }, //0，尚未处理；1，已处理
        message: String,
        causeCode: String, //异常类型
        autoHandle: Boolean,  //是否需要自动处理，否则为人工处理
        handleCode: String, //处理办法.
        desc: String,
        created: { type : Date, "default": Date.now() },
        modified: { type : Date, "default": Date.now() }
    });

     /**
     * Methods
     */
    ExchangeExceptionSchema.methods = {
    }
    
    /**
     * Statics
     */

    ExchangeExceptionSchema.statics = {

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

    return mongoose.model('ExchangeException', ExchangeExceptionSchema);
};

module.exports = new exchangeExceptionModel();
