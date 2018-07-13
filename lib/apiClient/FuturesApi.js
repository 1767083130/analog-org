'use strict';
const FuturesApi = require('ws-server').FuturesApi;
const setter = require('./apiRunSettings_mongo');

let bothApi = new class {
    getInstance(identifier,setter){
        let options = {
            site: identifier.site,
            appKey: identifier.appKey,
            appSecret: identifier.appSecret,
            setter: setter
        }
        return new FuturesApi(options);
    }
}();

module.exports = bothApi

