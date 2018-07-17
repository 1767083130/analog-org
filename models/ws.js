'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var wsModel = function(){
    const WsSchema = mongoose.Schema({
        site:{type:String,required:true},   //网站名称
        symbol:{type:String,required:true}, //交易品种
        bids:{type:Number,"default":0},
        asks:{type:Number,"default":0},
        timestamp:{type:Number}
    });

    WsSchema.methods={
    }

    WsSchema.statics={
        load: function (_id) {
            return this.findOne({ _id })
                .exec();
        },

        getwsClients: function(site,symbol){
            return this.find({ site:site,symbol:symbol })
                .exec();
        },

        getwsClient(site,symbol,timestamp){
            return this.findOne({ site:site,symbol:symbol,timestamp:timestamp })
                .exec();
        }
    };

    WsSchema.plugin(paginate);
    return mongoose.model('Ws',WsSchema);
};

module.exports = new wsModel();
