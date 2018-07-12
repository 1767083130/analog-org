'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const Order = mongoose.model('Order');
const StrategyPlan = mongoose.model('StrategyPlan');
const Decimal = require('decimal.js');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const CacheClient = require('ws-client').CacheClient;
const strategyPlanLib = require('../lib/strategyPlan');
const clientNetMonitor = require('../lib/apiClient/clientNetMonitor');

const INTERVAL = 4000; //4s
const PLAN_RUN_INTERVAL = 5 * 1000; //5s
const NODE_ENV = process.env.NODE_ENV || 'production'; //development
const PLAN_ORDER_MAX_COUNT = 4; //全部计划最多能允许没有成交的订单笔数，如果超过这个数量，所有的策略计划必须停止

process.on('uncaughtException', function(e) {
    console.error(e);
});

let runned = false;
let db = mongoose.connection;
db.once('open',function callback(){
    console.log(`数据库连接成功。系统开始运行策略计划`);
    if(cacheClient.readyState == CacheClient.OPEN){
        setTimeout(runStrategys,INTERVAL);
    } else {
        cacheClient.start(function(){
            console.log(`已成功连接数据服务器. ${cacheClient.options.serverUrl}`);
 
            let client = cacheClient.getClient();
            client.on('message', async function(res){ 
                switch(res.channel){
                case 'pong':
                    //console.log(JSON.stringify(res));
                    clientNetMonitor.pushPongItem(res.data);
                    break;
                }
            });

            if(NODE_ENV == 'production'){
                setTimeout(function(){
                    setInterval(runStrategyPlans,INTERVAL);
                },10000)
            } else {
                setTimeout(function(){
                    setInterval(runStrategyPlans,INTERVAL);
                },10000)
            } 
        });    
    }
});

async function runStrategyPlans(){
    let result = [];
    let strategyPlans = await getStrategyPlans();
    if(strategyPlans.length == 0){
        console.log('没有需要运行的策略计划');
        return result;
    }

    try{
        for(let strategyPlan of strategyPlans){
            let ordersCount = await getOrdersCountOfPlan(strategyPlan);
            if(ordersCount >= PLAN_ORDER_MAX_COUNT){
                console.log(`没有完成的订单多达${ordersCount}个，已超标，计划正在队列中等待...`);
                break;
            }

            let env = { userName: strategyPlan.userName };
            let options = {
                "env": env
            };
            let res = await strategyPlanLib.runStrategyPlan(strategyPlan,options);
            if(!res.isSuccess){
                console.log(`运行计划“${strategyPlan.name}”失败，返回错误信息: ${res.message}`);
            } else {
                console.log(`运行计划“${strategyPlan.name}”成功，返回信息: ${res.message}`);
            }
            result.push(res);
        }
    } catch (err){
        let res = { isSuccess: false,message: `系统错误:${err.message}` };
        result.push(res);
        console.error(err);
    }

    return result;
}

async function getStrategyPlans(){
    let recentDate = new Date(+new Date() - PLAN_RUN_INTERVAL);
    let isTest = (NODE_ENV  == 'production' ? false : true);
    let strategyPlans = await StrategyPlan.find({ 
        isValid: true,
        $or: [
            { lastRunTime: { $lt: recentDate } },
            { lastRunTime: { $exists: false } }
        ],
        status: { $in: ['wait'] } 
    });
    return strategyPlans;
}

async function getOrdersCountOfPlan(strategyPlan){
    let modifiedStart = new Date(+new Date() - 5 * 60 * 1000); //5分钟内

    //status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
    //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
    //wait_retry 准备重新发起委托，但还没有进行
    //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
    let ordersCount = await Order.find({ 
        userName: strategyPlan.userName,
        modified: { $gt: modifiedStart},
        status: { $in: ['wait','consign','part_success','will_cancel','wait_retry'] },  //,'auto_retry'
    }).count();

    return ordersCount;
    //return orders.length;  
}


