'use strict';

const mongoose = require('mongoose');

var dayPriceModel = function () {
    const DayPriceSchema = mongoose.Schema({
        date: { type : Date, require: true }, //交易日期
        site: { type: String },  //平台代号
        start: { num: Number,price: Number },  //开盘价
        end: { num: Number,price: Number },  //收盘价
        high: { num: Number,price: Number }, //最高价
        low: { num: Number,price: Number }, //最低价
        buy: Number,      // 买一价
        sell: Number,     // 卖一价
        limitHighestPrice: Number,  // 最高限价
        limitLowestPrice: Number,   // 最低限价

        last: { num: Number,price: Number }, //最新
        hold: { type: Number }, //持仓量
        vol: Number,  //成交量
        level: Number,//涨幅
        totalAmount: Number, //成交金额
        created: { type: Date, "default": Date.now() }, //创建日期
        symbol: String //货币类型
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

    return mongoose.model('DayPrice', DayPriceSchema);
};

module.exports = new dayPriceModel();
