'use strict';
const mongoose = require('mongoose');

var logModel = function () {
    const LogSchema = mongoose.Schema({
        userName: String,
        desc: String,
        track: String,
        status: { type: Number, "default": 0 }, //0，尚未处理；1，已处理
        causeCode: String,
        created: { type : Date, "default": Date.now() }
    });

     /**
     * Methods
     */
    LogSchema.methods = {
    }
    
    /**
     * Statics
     */

    LogSchema.statics = {

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

    return mongoose.model('Log', LogSchema);
};

module.exports = new logModel();
