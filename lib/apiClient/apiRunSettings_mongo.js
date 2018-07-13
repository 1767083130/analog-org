'use strict';

const mongoose = require('mongoose');
const ApiRunSettings  = mongoose.model('ApiRunSettings');

let apiRunSettings_mongo = new class {
    constructor(){
        /*
         {
            site: "huobi",
            appKey: "wqrw24242fgg",
            settingName: "TotalNum",
            settingValue: 32
         }
         */
        //this.client = this._getClient(identifierOrSite);
    }

    getLastedTime(site,appKey,callback){
        ApiRunSettings.findOne({ 
            site: site,
            appKey: appKey
        }, function(err,item){  
            if(err) throw err;  

            let nonce = item ? new Number(item.settingValue) : 2591203; //前259年农历十二月初三 - 秦始皇诞辰日
            callback(null,nonce);
        });
    }

    setLastedTime(site,appKey,nonce,callback){
        ApiRunSettings.findOneAndUpdate({ 
            site: site,
            appKey: appKey
        }, {
            $set : { settingValue : nonce }
        },function(err,item){  
            if(err) throw err;  
            callback &&　callback(null,nonce);
        });
    }
}();

module.exports = apiRunSettings_mongo;