'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * api执行时的一些参数记录。比如okex上次调用接口时间
 */
var apiCallLogsModal = function () {
    const ApiCallLogsSchema = mongoose.Schema({
        site: { type: String, required: true },
        clientType: {type: String },
        method: { type: String },
        code: { type: String },
        isRetry: { type: Boolean },
        params: { type:Schema.Types.Mixed },
        isSuccess: { type: Boolean },
        message: {type: String },
        created: { type: Date }
    });

     /**
     * Methods
     */
    ApiCallLogsSchema.methods = {
    }
    
    /**
     * Statics
     */
    ApiCallLogsSchema.statics = {

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
    return mongoose.model('ApiCallLogs', ApiCallLogsSchema);
};

module.exports = new apiCallLogsModal();

