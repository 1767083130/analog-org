'use strict';

const CacheClient = require('ws-client').CacheClient;
const configUtil = require('../apiClient/apiConfigUtil');

let cacheClient = new class{
    constructor(){
        this._cacheClient = null;
    }
    
    getInstance(){
        if(!this._cacheClient){
            this._cacheClient = new CacheClient({
                serverUrl: configUtil.getServerUrl()
            });
        }
        
        return this._cacheClient;
    }

}();

module.exports = cacheClient;