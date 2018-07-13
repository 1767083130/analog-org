'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var accountRunSettingsModel = function () {
    const AccountRunSettingsSchema = mongoose.Schema({
        site: { type: String },  
        userName: { type: String },
        symbol: { type: String },
        
        settingName: { type: String },
        settingValue: { type:Schema.Types.Mixed },

        created: { type: Date, default: Date.now },
        modified: { type: Date, default: Date.now }
    });

     /**
     * Methods
     */
    AccountRunSettingsSchema.methods = {

    }
    
    /**
     * Statics
     */

    AccountRunSettingsSchema.statics = {

        getAccountRunSetting(options,settingName){
            if(!options.site || !options.userName || !settingName){
                throw new Error('缺少参数');
            }

            options.settingName = settingName;
            return this.find(options).exec();
        },

        updateAccountRunSetting(options,settingName,settingValue){
            if(!options.site || !options.userName || !settingName){
                throw new Error('缺少参数');
            }

            options.settingName = settingName;
            return this.findOneAndUpdate(options,
                { settingValue: settingValue, modified: new Date()},
                { upsert: true,new: true}
            ).exec();
        },

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

    return mongoose.model('AccountRunSettings', AccountRunSettingsSchema);
};

module.exports = new accountRunSettingsModel();
