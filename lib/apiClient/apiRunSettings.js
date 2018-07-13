'use strict';

let apiRunSettings = new class {
    constructor(){
        this.settings = [];
        /*
         {
             site: "huobi",
             items:[{
                 settingName: "TotalNum",
                 appKey: "wqrw24242fgg",
                 settingValue: 32
             }]
         }
         */
        //this.client = this._getClient(identifierOrSite);
    }

    getSiteSettings(site,callback){
        let siteSettings = this.settings.find(function(value){
            return value.site == site;
        });

        if(!siteSettings){
            siteSettings = {
                site: site,
                items:[]
            };
            this.settings.push(siteSettings);
        }
        siteSettings = siteSettings || [];

        callback(null,siteSettings);
    }

    increaseTotalNum(site,appKey,callback){
        this.getTotalNum(site,appKey,function(err,totalNum){
            totalNum++;
            this.setTotalNum(site,appKey,totalNum);
            callback(null,totalNum);
        });
    }

    setTotalNum(site,appKey,totalNum,callback){
        this._getTotalNumItem(site,appKey,function(err,item){
            item.settingValue = totalNum;
            callback(null,totalNum);
        });
    }

    getTotalNum(site,appKey,callback){
        let item = this._getTotalNumItem(site,appKey,function(err,item){
            let totalNum = item ? item.settingValue : 0;
            callback(null,totalNum);
        });
    }

    _getTotalNumItem(site,appKey,callback){
        this.getSiteSettings(site,function(err,siteSettings){
            let item = siteSettings.items.find(function(value){
                return value.appKey == appKey && value.settingName == "TotalNum";
            });
    
            if(!item){
                item = {
                    settingName: "TotalNum",
                    appKey: appKey,
                    settingValue: 0
                };
                siteSettings.items.push(item);
            }

            callback(null,item);
        });
     
    }

    getLastedTime(site,appKey,callback){
        this._getLastedTimeItem(site,appKey,function(err,item){
            let nonce = item ? item.settingValue : null;
            callback(err,nonce);
        });
    }

    setLastedTime(site,appKey,nonce,callback){
        this._getLastedTimeItem(site,appKey,function(err,item){
            item.settingValue = nonce;
            callback(err,nonce);
        });
    }

    _getLastedTimeItem(site,appKey,callback){
        this.getSiteSettings(site,function(err,siteSettings){
            let item = siteSettings.items.find(function(value){
                return value.appKey == appKey && value.settingName == "LastedTime";
            });
    
            if(!item){
                item = {
                    settingName: "LastedTime",
                    appKey: appKey,
                    settingValue: null
                };
                siteSettings.items.push(item);
            }
    
            callback(null,item);
        });

    }

}();

module.exports = apiRunSettings;