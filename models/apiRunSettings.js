'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * api执行时的一些参数记录。比如okex上次调用接口时间
 */
var apiRunSettingsModal = function () {
    const ApiRunSettingsSchema = mongoose.Schema({
        site: { type: String, required: true },
        settingName: { type: String, required: true },
        appKey: { type: String, required: true },
        settingValue: { type: String }
    });

     /**
     * Methods
     */
    ApiRunSettingsSchema.methods = {
    }
    
    /**
     * Statics
     */
    ApiRunSettingsSchema.statics = {

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
    return mongoose.model('ApiRunSettings', ApiRunSettingsSchema);
};

module.exports = new apiRunSettingsModal();

