'use strict';
const BothApi = require('ws-server').BothApi;
const setter = require('./apiRunSettings_mongo');

let bothApi = new class {
    getInstance(identifier){
        let options = {
            site: identifier.site,
            appKey: identifier.appKey,
            appSecret: identifier.appSecret,
            setter: setter
        }
        return new BothApi(options);
    }
}();

module.exports = bothApi