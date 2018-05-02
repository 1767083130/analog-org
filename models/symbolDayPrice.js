/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');

var dayPriceModel = function () {
    const DayPriceSchema = mongoose.Schema({
        symbol: String, //货币类型
        date: { type : Date, require: true }, //交易日期
        start: { num: Number,price: Number },  //开盘价
        end: { num: Number,price: Number },  //收盘价
        high: { num: Number,price: Number }, //最高价
        low: { num: Number,price: Number }, //最低价
        last: { num: Number,price: Number }, //最新
        vol: Number,  //成交量
        level: Number,//涨幅
        totalAmount: Number, //成交金额
        created: { type: Date, "default": Date.now() } //创建日期
    });

     /**
     * Methods
     */
    DayPriceSchema.methods = {
    }
    
    /**
     * Statics
     */

    DayPriceSchema.statics = {

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
        getFirstDayPrice: function(_id){
            return this.findOne({ _id }) //todo
                .exec();
        }

    };

    return mongoose.model('SymbolDayPrice', DayPriceSchema);
};

module.exports = new dayPriceModel();
