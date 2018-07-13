'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var betweenStrategyModel = function () {
    const BetweenStrategySchema = mongoose.Schema({
        userName: { type: String, required: true }, 
        isTest: { type: Boolean },
        status: { type: String,default:"valid" }, //valid,unvalid
        openType: { type: String, default: "private" },
        
        site: { type: String, required: true }, 
        symbol: { type: String, required: true },
        ignoreAmount: { type: Number },
        minProfine: { type: Number },
        side: { type: Number }, //0为先进后出
        maxLoss: { type: Number },
        turnPercent: { type: Number },

        standPrice:  { type: Number },
        standAmount:  { type: Number },
      
        created: { type : Date, "default": Date.now() },
        modified: { type : Date, "default": Date.now() }

    });

     /**
     * Methods
     */
    BetweenStrategySchema.methods = {


    }
    
    /**
     * Statics
     */
    BetweenStrategySchema.statics = {

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
        getUserStrategy: function(userName){
            return this.find({ userName: userName }).exec();
        }
    };

    BetweenStrategySchema.plugin(paginate);
    return mongoose.model('BetweenStrategy', BetweenStrategySchema);
};


module.exports = new betweenStrategyModel();

