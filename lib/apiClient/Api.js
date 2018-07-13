'use strict';
const setter = require('./apiRunSettings_mongo');
const Api = require('ws-server').Api;

let api = new class {
    getInstance(identifier){
        let options = {
            site: identifier.site,
            appKey: identifier.appKey,
            appSecret: identifier.appSecret,
            setter: setter
        }
        return new Api(options);
    }
}();

module.exports = api
