'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const orderLib = require('../lib/order');
const realTimePrice = require('../lib/realTimePrice');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const CacheClient = require('ws-server').CacheClient;
const NormalStrategyRunner = require('../lib/transferStrategys/NormalStrategyRunner');
const transferController = require('../lib/transferStrategys/transferController');
const ClientIdentifier = mongoose.model('ClientIdentifier');
const User = mongoose.model('User');
const Order = mongoose.model('Order');
const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const Decimal = require('decimal.js'),
    fs= require('fs'),
    positionLib = require('../lib/position'),
    symbolUtil = require('../lib/utils/symbol'),
    identifierLib = require('../lib/clientIdentifier');

/**
 * 修改订单价格
 */

// const SYMBOL = 'eth#usd_1w';
// const SITE = 'okex';

const INTERVAL = 15 * 1000; //15s
const CLIENT_TYPE = "client" 
const MIN_STEP_AMOUNT = 1;
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

process.on('uncaughtException', function(e) {
    console.error(e);
});

let db = mongoose.connection;
db.once('open',function callback(){
    console.log(`数据库连接成功.程序在${NODE_ENV}环境下运行`);
    if(cacheClient.readyState == CacheClient.OPEN){
        setTimeout(runStrategys,INTERVAL);
    } else {
        cacheClient.start(async function(){
            let client = cacheClient.getClient();
            //处理返回的数据
            client.on('message', async function(res){ 
                //console.log(JSON.stringify(res));
                switch(res.channel){
                case 'trade':
                    //console.log(JSON.stringify(res));
                    break;
                }
            }.bind(this));

            client.on('pong',function(){
                console.log('pong');
            })

            setTimeout(async function() {
                let createOrderRes = await createTestOrder();
                console.log(JSON.stringify(createOrderRes));
                // if(createOrderRes.isSuccess){
                //     let renewOrderRes = await renewOrder(createOrderRes.order);
                //     console.log(JSON.stringify(renewOrderRes));
                // } else {
                //     console.log(createOrderRes.message);
                // }
            },10000);
        });    
    }
});


/**
 * 执行需要委托交易的差价策略的step
 * @param {Object} logOperate,对应TransferStrategyLog的operates项
 * @param {Object} options
 * @param {ClientIdentifier} [options.identifier], 可为空
 * @param {Number} options.stepAmount,差价策略每次委托金额
 * @param {Array} [options.depths] 市场深度
 * @returns {Object} 是否成功。如{
     { isSuccess: true, //是否成功
        actionId: newOrder._id, //委托Id
        order: newOrder } //委托交易
    * @public
    */
async function createTestOrder(){ 
    const SYMBOL = 'eos#usd';
    const SITE = 'bitfinex';
    const SIDE = 'buy';
    const AMOUNT = 3; //数量

    let res = { isSuccess: false };
    let getDepthsRes = realTimePrice.getSymbolDepths(SITE,SYMBOL);
    if(!getDepthsRes.isSuccess){
        return  { isSuccess: false, errorCode: "100003", message: "获取市场行情失败" };   
    }

    let newDepths = getDepthsRes.data;
    if(!newDepths){
        return  { isSuccess: false, errorCode: "100003", message: "获取市场行情失败" };    
    }

    let operateType = SIDE; 
    if(AMOUNT < 0){
        operateType = (operateType == 'buy' ? 'sell' : 'buy');
    }
    let price = _getPostOnlyPrice(newDepths,operateType);
    price += 1;
    let order = {
        site: SITE, //平台名称
        userName: 'lcm', 
        isTest: false,
        side: SIDE, //buy或sell
        leverage:  1,
        reason: "transfer", //原因
        symbol: SYMBOL, //cny、btc、ltc、usd
        consignDate: new Date(), //委托时间
        
        isPostOnly: true, 
        price: price, //委托价格
        amount: AMOUNT, //总数量  

        consignAmount: AMOUNT, //已委托数量  //TODO 这里有问题
        //bargainAmount:  { type: Number, "default": 0 }, //已成交数量
        //prarentOrder: { type: Schema.ObjectId },
        //childOrder: { type: Schema.ObjectId }, 
        //actionId: transferStrategyLog._id,
        //operateId: logOperate.id, //操作Id
        isSysAuto: true,
        //outerId: String,  //外部交易网站的Id
        status: "wait", 

        created: new Date(), //创建时间
        modified: new Date() //最近修改时间
    };

    res = await orderLib.createOrder(order);
    return res;
}

function _getPostOnlyPrice(depths,operateType,priceSteps = 1){
    let price,digitLen;
    let parts = depths.bids[0][0].toString().split('.');
    if(parts.length == 2){
        digitLen = parts[1].length;
    } else { //== 1
        digitLen = 0;
    }
    priceSteps = priceSteps || 1;

    let minStep = 1,stepPrice = 0;
    if(digitLen > 0){
        minStep = 1 / Math.pow(10,digitLen);
    }
    stepPrice = new Decimal(minStep).times(priceSteps);

    let basePrice;
    if(operateType == 'buy'){
        console.log(depths.asks[0][0]);
        basePrice = new Decimal(depths.asks[0][0]).minus(stepPrice);
    } else { //sell
        console.log(depths.bids[0][0]);
        basePrice = new Decimal(depths.bids[0][0]).plus(stepPrice);
    }

    return basePrice.toNumber();
}

async function renewOrder(order){
    try {
        let res = await orderLib.updateOrderPrice(order);
        return res;
    } catch (err){
        order.autoRetryFailed++;
        order.save();
        console.error(err);
        return { isSuccess: false, message: "服务器端错误"}
    }
}
