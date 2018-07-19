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
let runPlansTimer = null;
db.once('open',function callback(){
    console.log(`数据库连接成功。系统开始运行策略计划`);
    if(cacheClient.readyState == CacheClient.OPEN){
        if(runPlansTimer){
            clearInterval(runPlansTimer);
        }
        runPlansTimer = setInterval(runStrategyPlans,INTERVAL);
    } else {
        let client = cacheClient.getClient();
        cacheClient.start(function(){
            console.log(`已成功连接数据服务器. ${cacheClient.options.serverUrl}`);
            if(runPlansTimer){
                clearInterval(runPlansTimer);
            }
            if(NODE_ENV == 'production'){
                setTimeout(function(){
                    runPlansTimer = setInterval(runStrategyPlans,INTERVAL);
                },10000)
            } else {
                setTimeout(function(){
                    runPlansTimer = setInterval(runStrategyPlans,INTERVAL);
                },10000)
            } 
        });    
        
        client.on('message', async function(res){ 
            switch(res.channel){
            case 'pong':
                //console.log(JSON.stringify(res));
                clientNetMonitor.pushPongItem(res.data);
                break;
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
            let ordersCount = await strategyPlanLib.getUnEndedPlanOrdersCount(strategyPlan);
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




