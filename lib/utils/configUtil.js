'use strict';

const config  = require('../../config/customConfig');

let configUtil = new class {
    getBusiness(){
        return config.business;
    }

    getServerUrl(){
        return config.serverUrl;
    }

    getDatabaseConfig(){
        return config.databaseConfig;
    }

    getConfig(){
        return config;
    }
}()

module.exports = configUtil;
