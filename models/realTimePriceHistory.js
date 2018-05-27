/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');

var realTimePriceHistoryModel = function () {
    const RealTimePriceHistorySchema = mongoose.Schema({
        time: { type : Date, "default": Date.now() },
        site: { type: String },  

        vol: Number, //成交量
        level: Number, //涨幅
        bids: [], //买10  每个数组项同时也为一个数组，格式为 [price,amount]，[0],价格；[1]为委托数量
        asks: [], //卖10 每个数组项同时也为一个数组，格式为 [price,amount]，[0],价格；[1]为委托数量
        // priceHigh: Number, //最高
        // priceLow: Number, //最低
        // priceLast: Number, //收盘价
        priceNew: Number, //最新
        //priceOpen: Number, //开盘
        totalAmount: Number,  //总量（人民币） 
        symbol: String //类型
    });


    /**
     * Methods
     */
    RealTimePriceHistorySchema.methods = {
        getPrices : function(){
            return this.bids.concat(this.asks);
        }
    }
    
    /**
     * Statics
     */

    RealTimePriceHistorySchema.statics = {

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

    return mongoose.model('RealTimePriceHistory', RealTimePriceHistorySchema);
};

module.exports = new realTimePriceHistoryModel();
