/**
 * 第三方网站oauth2.0账户
 */
'use strict';
const mongoose = require('mongoose');

var clientIdentifierModel = function () {
    const ClientIdentifierSchema = mongoose.Schema({
        site: String,
        userName: String,
        appKey: String,
        appSecret: String,
        safePassword: String,
        coinAddresses: [{ 
            coin: String, 
            address: String,
            fee: { type: Number, default: 0 }
        }],
        isValid: { type: Boolean, default: true },
        created: { type: Date, default: Date.now() },
        modified: { type: Date, default: Date.now() }
    });

     /**
     * Methods
     */
    ClientIdentifierSchema.methods = {

    }
    
    /**
     * Statics
     */
    ClientIdentifierSchema.statics = {

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

        /**
         * 获取用户的有效第三方交易平台授权
         * 
         * @param {String} userName 用户名
         */
        getUserClients: function(userName){
            return this.find({ userName: userName, isValid: true })
                .exec();
        },

        getUserClient(userName,site){
            return this.findOne({ userName: userName, site: site, isValid: true })
                .exec();
        },

        /**
         * 获取提币地址
         */
        getWithdrawAddress(client,coin){
            let addressItem = client.coinAddresses.find(function(value){
                return value.coin == coin;
            });
            if(addressItem){
                return addressItem.address;
            }
        }
    };

    return mongoose.model('ClientIdentifier', ClientIdentifierSchema);
};


module.exports = new clientIdentifierModel();
