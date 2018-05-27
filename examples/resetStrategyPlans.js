'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const StrategyPlan = mongoose.model('StrategyPlan');
/**
 * 重置策略计划
 */

process.on('uncaughtException', function(e) {
    console.error(e);
});

let db = mongoose.connection;
db.once('open',async function callback(){
    console.log('数据库连接成功');
    await resetStrategyPlans();
    console.log('已完成');
});


async function resetStrategyPlans(){
    let result = [];
    let strategyPlans = await getStrategyPlans();

    try{
        for(let strategyPlan of strategyPlans){
            strategyPlan.status = 'wait';
            for(let strategy of strategyPlan.strategys){
                strategy.consignAmount = 0;
                strategy.actualAmount = 0;
            }
           
            await strategyPlan.save();
        }
    } catch (err){
        let res = { isSuccess: false,message: `系统错误:${err.message}` };
        result.push(res);
        console.error(err);
    }

    return result;
}

async function getStrategyPlans(){
    let strategyPlans = await StrategyPlan.find({ 
        isValid: true,
        //status: { $in: ['wait', 'running'] } 
    });
    return strategyPlans;
}
