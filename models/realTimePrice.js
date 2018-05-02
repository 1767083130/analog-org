/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');

var realTimePriceModel = function () {
    const RealTimePriceSchema = mongoose.Schema({
        time: { type : Date, "default": Date.now() },
        site: { type: String },  

        vol: Number, //成交量
        level: Number, //涨幅
        buys: [], //买10  每个数组项同时也为一个数组，格式为 [price,amount]，[0],价格；[1]为委托数量
        sells: [], //卖10 每个数组项同时也为一个数组，格式为 [price,amount]，[0],价格；[1]为委托数量
        //                    //期货周期类型有week,nextWeek,quarter 
        // priceHigh: Number, //最高
        // priceLow: Number, //最低
        // priceLast: Number, //收盘价
        priceNew: Number, //最新
        //priceOpen: Number, //开盘
        totalAmount: Number,  //总量（人民币） 
        symbol: String //货币类型
    });


     /**
     * Methods
     */
    RealTimePriceSchema.methods = {
        getPrices : function(){
            return this.buys.concat(this.sells);
        }
    }
    
    /**
     * Statics
     */

    RealTimePriceSchema.statics = {

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

    return mongoose.model('RealTimePrice', RealTimePriceSchema);
};

module.exports = new realTimePriceModel();
