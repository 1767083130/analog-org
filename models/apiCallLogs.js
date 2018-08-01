'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * api执行时的一些参数记录。比如okex上次调用接口时间
 */
var apiCallLogModal = function () {
    const ApiCallLogSchema = mongoose.Schema({
        site: { type: String, required: true },
        clientType: {type: String },
        method: { type: String },
        code: { type: String },
        isRetry: { type: Boolean },
        params: { type:Schema.Types.Mixed },
        isSuccess: { type: Boolean },
        message: {type: String },
        created: { type: Date, default: Date.now() },
        modified: {type: Date, default: Date.now() }
    });

     /**
     * Methods
     */
    ApiCallLogSchema.methods = {
    }
    
    /**
     * Statics
     */
    ApiCallLogSchema.statics = {

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
    return mongoose.model('ApiCallLog', ApiCallLogSchema);
};

module.exports = new apiCallLogModal();

