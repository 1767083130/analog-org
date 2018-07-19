'use strict';
const mongoose = require('mongoose');

var apiOrderLogModel = function () {
    const ApiOrderLogSchema = mongoose.Schema({
        site: { type: String },
        outerId: { type: String },
        symbol: { type: String },
        type: { type: String }, //“LIMIT”, “MARKET”, “STOP”, “TRAILING_STOP”, “EXCHANGE_MARKET”, “EXCHANGE_LIMIT”, “EXCHANGE_STOP”, “EXCHANGE_TRAILING_STOP”, “FOK”, “EXCHANGE_FOK”
        status: { type: String },//status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                        //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                        //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败

        amount: { type: Number }, //已委托数量
        dealAmount: { type: Number }, //已成交数量
        side: { type: String },

        created: { type: Date },
        price: { type: Number }, //委托价格
        avgPrice: { type: Number }, //成交的平均价格
        hidden: { type: Boolean },
        unit: { type: String },
        maker: { type: String }
    });

     /**
     * Methods
     */
    ApiOrderLogSchema.methods = {
    }
    
    /**
     * Statics
     */

    ApiOrderLogSchema.statics = {

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

    return mongoose.model('ApiOrderLog', ApiOrderLogSchema);
};

module.exports = new apiOrderLogModel();
