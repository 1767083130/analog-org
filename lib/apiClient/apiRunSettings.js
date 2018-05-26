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

    getSiteSettings(site){
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

        return siteSettings || [];
    }

    increaseTotalNum(site,appKey){
        let totalNum = this.getTotalNum(site,appKey);
        totalNum++;

        this.setTotalNum(site,appKey,totalNum);
        return totalNum;
    }

    setTotalNum(site,appKey,totalNum){
        let item = this._getTotalNumItem(site,appKey);
        item.settingValue = totalNum;

        return totalNum;
    }

    getTotalNum(site,appKey){
        let item = this._getTotalNumItem(site,appKey);
        let totalNum = item ? item.settingValue : 0;
        return totalNum;
    }

    _getTotalNumItem(site,appKey){
        let siteSettings = this.getSiteSettings(site);
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

        return item;
    }

    getLastedTime(site,appKey){
        let item = this._getLastedTimeItem(site,appKey);
        let nonce = item ? item.settingValue : null;
        return nonce;
    }

    setLastedTime(site,appKey,nonce){
        let item = this._getLastedTimeItem(site,appKey);
        item.settingValue = nonce;
    }

    _getLastedTimeItem(site,appKey){
        let siteSettings = this.getSiteSettings(site);
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

        return item;
    }

}();

module.exports = apiRunSettings;