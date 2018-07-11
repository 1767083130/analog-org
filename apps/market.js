'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const trialMarketLib = require('../lib/transferStrategys/trialMarket')
const mongoose = require('mongoose');
const Graph = require('./graph');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();

let dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

let db = mongoose.connection;
db.once('open',function callback(){
});

const Decimal = require('decimal.js'),
    request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    fs= require('fs'),
    path = require('path'),

    positionLib = require('../lib/position'),
    symbolUtil  = require('../lib/utils/symbol'),
    apiConfigUtil = require('../lib/apiClient/apiConfigUtil');

let datas = []; //e.g {"event":"subscribed","channel":"book","chanId":64,"prec":"P0","freq":"F0","len":"25","pair":"BTCUSD"}
const SYMBOL = 'btc#cny';
const INTERVAL = 1 * 60 * 1000; //1分钟
let runLogs = []; //e.g [{ siteA: "huobi",symbolA: "btc#cny",siteB: "okex", lastTime: +new Date() }]
const PLATFORMS = [{ site: "bitfinex", clientType: "client"},
                   {site: "okex", clientType: "client"}
                ]; //apiConfigUtil.getAllPlatforms(); 

const CLIENT_TYPE = "client" 

let positionInfo = [],
    marketInfo = [],
    walletInfo = [];

process.on('uncaughtException', function(e) {
    //todo
    console.error(e);
});

if(cacheClient.readyState == 'OPEN'){
    setInterval(trialNoLimit,INTERVAL);
} else {
    cacheClient.start(function(){
        console.log(`已成功连接数据服务器. ${cacheClient.options.serverUrl}`);
        setInterval(trialNoLimit,INTERVAL);
    });    
}

async function trialNoLimit(){
    let resItems = [];
    let platforms = getValidPlatforms();

    for(let i = 0; i < platforms.length; i++){
        let platformA = platforms[i];
        for(j = i + 1; j < platforms.length; j++){
            let platformB = platforms[j];
            let item = await trialMarketLib.trialPairNoLimit(platformA.site,platformB.site);
            resItems.push(item);
        }
    }

    return resItems;
}

function getValidPlatforms(){
    let allPlatfoms = apiConfigUtil.getAllPlatforms(); 
    let platforms = allPlatfoms.filter(function(item){
        return PLATFORMS.findIndex(v => v.site == item.site) != -1;
    });
    return platforms;
}
