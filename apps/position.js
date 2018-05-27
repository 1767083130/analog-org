'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const orderLib = require('../lib/order');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const asset = require('../lib/asset');
const position = require('../lib/position');
const CacheClient = require('ws-client').CacheClient;
const NormalStrategyRunner = require('../lib/transferStrategys/NormalStrategyRunner');
const transferController = require('../lib/transferStrategys/transferController');
const User = mongoose.model('User');
const Order = mongoose.model('Order');
const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const Decimal = require('decimal.js'),
    path = require('path'),
    fs= require('fs');

const INTERVAL = 15 * 1000; //15s
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

process.on('uncaughtException', function(e) {
    console.error(e);
});

let db = mongoose.connection;
db.once('open',function callback(){
    console.log('数据库连接成功');
    if(cacheClient.readyState == CacheClient.OPEN){
    } else {
        cacheClient.start(function(){
            let client = cacheClient.getClient();
            //处理返回的数据
            client.on('message', async function(res){ 
                //console.log(JSON.stringify(res));
            }.bind(this));

            client.on('pong',function(){
                console.log('pong');
            });

            if(NODE_ENV != 'production'){
                setTimeout(getTotalAsset,INTERVAL);
            } else { //dev
                setInterval(getTotalAsset,INTERVAL);
            }
        });    
    }
});

async function getTotalAsset(site){
    let assetInfo = await asset.getTotalAsset(site);
    let positionInfo = await position.getPositions(site);

    let res;
    if(!positionInfo.isSuccess || !assetInfo.isSuccess){
        res = { isSuccess: false, message: "系统发生错误" };
    } else {
        res = { 
            isSuccess: true,
            asset: assetInfo, 
            position: positionInfo
        };
    }

    fs.writeFile(path.join(__dirname,'logs',  'asset.txt'),JSON.stringify(res), (err) =>  {
        if (err) throw err;
        console.log('The file asset.txt has been saved!');
    });
    console.log(JSON.stringify(res));
}

