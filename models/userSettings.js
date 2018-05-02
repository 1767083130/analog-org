/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSettingsModel = function () {
    const UserSettingsSchema = mongoose.Schema({
        userName: String,
        status: String,
        modified: { type : Date, "default": Date.now() }
    });

     /**
     * Methods
     */
    UserSettingsSchema.methods = {


    }
    
    /**
     * Statics
     */
    UserSettingsSchema.statics = {

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
        getUserSettings: function(userName){
            return this.findOne({ userName: userName }).exec();
        }
    };

    return mongoose.model('UserSettings', UserSettingsSchema);
};


module.exports = new UserSettingsModel();
