'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

