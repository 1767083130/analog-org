/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var manualTaskModel = function () {
    const ManualTaskSchema = mongoose.Schema({
        userName: String,
        desc: String,
        type: String, //trade,transfer,futureTrade
        refId: String,
        params: { type: Schema.Types.Mixed },
        status: { type: String, "default": 0 }, //wait，尚未处理；success，已处理;canceled,
        created: { type : Date, "default": Date.now() },
        modified: { type : Date, "default": Date.now() },
    });

     /**
     * Methods
     */
    ManualTaskSchema.methods = {
    }
    
    /**
     * Statics
     */

    ManualTaskSchema.statics = {

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

    ManualTaskSchema.plugin(paginate);
    return mongoose.model('ManualTask', ManualTaskSchema);
};

module.exports = new manualTaskModel();
