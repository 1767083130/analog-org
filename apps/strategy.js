'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const orderLib = require('../lib/order');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const CacheClient = require('ws-server').CacheClient;
const NormalStrategyRunner = require('../lib/transferStrategys/NormalStrategyRunner');
const transferController = require('../lib/transferStrategys/transferController');
const User = mongoose.model('User');
const Order = mongoose.model('Order');
const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const Decimal = require('decimal.js'),
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
        setTimeout(runStrategys,INTERVAL);
    } else {
        cacheClient.start(function(){
            let client = cacheClient.getClient();
            //处理返回的数据
            client.on('message', async function(res){ 
                //console.log(JSON.stringify(res));
                switch(res.channel){
                case 'order':
                    if(res.isSuccess){
                        await onOrderMessage(res.data,res.site);
                    }
                    break;
                case 'trade':
                    //console.log(JSON.stringify(res));
                    break;
                }
            }.bind(this));

            client.on('pong',function(){
                console.log('pong');
            })

            if(NODE_ENV == 'production'){
                setInterval(runStrategys,INTERVAL);
                setInterval(renewOrders,INTERVAL);
            } else {
                setTimeout(runStrategys,INTERVAL);
                //setTimeout(renewOrders,INTERVAL);
            }
        });    
    }
});

/**
 * 处理订单信息
 * @param {Array} apiOrders 
 */
async function onOrderMessage(apiOrders,site){
    /**
     * apiOrder数据结构
        outerId: apiOrder.id,
        symbol: common.getApiSymbol(apiOrder.symbol,true),
        type: type, //“LIMIT”, “MARKET”, “STOP”, “TRAILING_STOP”, “EXCHANGE_MARKET”, “EXCHANGE_LIMIT”, “EXCHANGE_STOP”, “EXCHANGE_TRAILING_STOP”, “FOK”, “EXCHANGE_FOK”
        status: status,//status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                        //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                        //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
        dealAmount: apiOrder.amount, //已处理数量
        amount: apiOrder.amountOrig, //已委托数量
        created: +apiOrder.mtsCreate,
        price: apiOrder.price,
        avgPrice: apiOrder.priceAvg,
        hidden: apiOrder.hidden,
        maker: apiOrder.maker
     */
    try{
        for(let apiOrder of apiOrders){
            apiOrder.site = site;
            let order = await Order.findOne({ outerId: apiOrder.outerId,site: site });
            if(!order){
                continue;
            }

            let stepAmount = new Decimal(apiOrder.dealAmount).minus(order.bargainAmount).toNumber(); //更改帐户的金额
            let newOrder = await orderLib.refreshOrder(order, apiOrder);

            let e = {
                order: newOrder, //变更后的订单
                stepAmount: stepAmount //变更的额度
            };
            await transferController.onOrderStatusChanged(e);
        }
    } catch (err) {
        console.error(err);
    }
}

async function runStrategys(){
    let result = [];
    let normalStrategyRunner = new NormalStrategyRunner();
    let strategys = await getTransferStrategys();

    try{
        for(let strategy of strategys){
            let env = { userName: strategy.userName };
            let options = {
                env:env
            };
            let res = await normalStrategyRunner.runStrategy(strategy,options);
            result.push(res);
        }
    } catch (err){
        let res = { isSuccess: false,message: `系统错误:${err.message}` };
        result.push(res);
        console.error(err);
    }

    return result;
}

async function getTransferStrategys(){
    let isTest = (NODE_ENV  == 'production' ? false : true);
    let strategys = await TransferStrategy.find({ isValid: true });
    return strategys;
}

async function renewOrders(){
    let now = new Date();
    let modifiedStart = new Date().setTime(+now - 2 * 24 * 60 * 60 * 1000); //超过2天的就不处理了
    let modifiedEnd = new Date().setTime(+now - 0.5 * 60 * 1000); //超过0.5分钟还未成交的就修改价格

    let orders = await Order.find({ 
        reason: "transfer",
        isSysAuto: true,
        autoRetry: true,
        modified: { $lt: modifiedEnd },
        modified: { $gt: modifiedStart},
        autoRetryFailed: { $lt: 2 },
        status: { $in: ['consign','part_success','auto_retry'] }, 
        "$where": function(){
            return Math.abs(this.bargainAmount) < Math.abs(this.consignAmount)
        } 
    });

    for(let i = 0; i < orders.length; i++){
        let order = orders[i];
        try {
            await orderLib.updateOrderPrice(order);
        } catch (err){
            order.autoRetryFailed++;
            order.save();
            console.error(err);
        }
    }
}
