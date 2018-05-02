/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');

var systemRunSettings = function () {
    const SystemRunSettingsSchema = mongoose.Schema({
        site: { type: String }, 
        lastTimeSyncAccount: Date,
        lastTimeImportDayInfo: Date,
        isLocked: Boolean //防止脏读
    });

     /**
     * Methods
     */
    SystemRunSettingsSchema.methods = {
    }
    
    /**
     * Statics
     */

    SystemRunSettingsSchema.statics = {

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
        getRecentDay: function(site){
            return this.findOne({ site: site }) //todo
                    .exec();
        }
    };

    return mongoose.model('SystemRunSettings', SystemRunSettingsSchema);
};

module.exports = new systemRunSettings();
