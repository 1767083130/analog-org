'use strict';

const debug = require('debug')('analog:examples:testMongodb');
const mongoose = require('mongoose');
const co = require('co');
const customConfig = require('../config/customConfig');
const database = require('../lib/database');


/**
 * 运行方式： node test/lib/transferStrategys/strategyTester
 */


let dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const StrategyPlan = mongoose.model('StrategyPlan');
const StrategyPlanLog = mongoose.model('StrategyPlanLog');

let db = mongoose.connection;
db.once('open', async function callback(){

    // //strategyPlanLog.desc = '456';
    // strategyItem.actualAmount++;
    // await strategyPlanLog.save();
    // strategyPlanLog = await StrategyPlanLog.findOne({ _id: strategyPlan.currentLog });
    // strategyItem = strategyPlanLog.strategys[0];
    // debug(`actualAmount: ${strategyItem.actualAmount}`);
    // debug(`desc: ${strategyPlanLog.desc}`);

    // await test();
    // await test();
    test1();
    test1();
});

async function test(){
    let strategyPlan = await StrategyPlan.findOne({ name: 'TEST',isValid: true });
    let strategyPlanLog = await StrategyPlanLog.findOne({ _id: strategyPlan.currentLog });

    let strategyItem = strategyPlanLog.strategys[0];
    debug(`actualAmount: ${strategyItem.actualAmount}`);
    debug(`desc: ${strategyPlanLog.desc}`);

    for(let i = 0; i < 50; i++){
        //strategyPlanLog.desc = '123';
        strategyItem.actualAmount++;
        await strategyPlanLog.save();
        strategyPlanLog = await StrategyPlanLog.findOne({ _id: strategyPlan.currentLog });
        strategyItem = strategyPlanLog.strategys[0];
        debug(`actualAmount: ${strategyItem.actualAmount}`);
        //debug(`desc: ${strategyPlanLog.desc}`);
    }
}

async function test1(){
    let strategyPlan = await StrategyPlan.findOne({ name: 'TEST',isValid: true });
    let strategyPlanLog = await StrategyPlanLog.findOne({ _id: strategyPlan.currentLog });

    let strategyItem = strategyPlanLog.strategys[0];
    // debug(`actualAmount: ${strategyItem.actualAmount}`);
    // debug(`desc: ${strategyPlanLog.desc}`);

    for(let i = 0; i < 50; i++){
        strategyPlanLog = await StrategyPlanLog.findOneAndUpdate({ 
            _id: strategyPlan.currentLog,
            'strategys.strategyId': strategyItem.strategyId,
            //"$atomic" : "true"
        },{ 
            $inc: {'strategys.$.actualAmount': 1 }
        },{ 
            upsert: false,
            new: true
        }).exec();

        strategyItem = strategyPlanLog.strategys[0];
        debug(`actualAmount: ${strategyItem.actualAmount}`);
    }

    // for(let i = 0; i < 50; i++){
    //     //strategyPlanLog.desc = '123';
    //     strategyItem.actualAmount++;
    //     await strategyPlanLog.save();
    //     strategyPlanLog = await StrategyPlanLog.findOneAndUpdate({ 
    //         _id: strategyPlan.currentLog 
    //     });
    //     strategyItem = strategyPlanLog.strategys[0];
    //     debug(`actualAmount: ${strategyItem.actualAmount}`);
    //     //debug(`desc: ${strategyPlanLog.desc}`);
    // }
}

/**
 * 更改策略计划中的金额
 * @param {*} strategyPlanLog 策略计划Log
 * @param {*} options 需要变更的金额
 * @param {*} options.strategyId 策略_Id
 * @param {Number} [options.actualAmountChange] 实际已成交数量的变更额度，比如2,表示成交2个对应的交易品种
 * @param {Number} [options.consignAmountChange] 实际已委托数量的变更额度，比如2,表示委托2个对应的交易品种，但有可能尚未成交（也有可能已成交）
 * @public
 */
async function updateStrategyPlanAmount(strategyPlanLog,options){
    if(!options.strategyId){
        throw new Error(`参数options.strategyId不能为空`);
    }

    strategyPlanLog.strategys = strategyPlanLog.strategys || [];
    let planStrategy = strategyPlanLog.strategys.find(p => p.strategyId.toString() == options.strategyId.toString());
    if(planStrategy){
        if(options.actualAmountChange){
            debug(`actualAmountChange: ${options.actualAmountChange}`)
            planStrategy.actualAmount = new Decimal(planStrategy.actualAmount).plus(options.actualAmountChange).toNumber();
        }
        if(options.consignAmountChange){
            planStrategy.consignAmount = new Decimal(planStrategy.consignAmount).plus(options.consignAmountChange).toNumber();
        }
    } else {
        planStrategy = {
            actualAmount: options.actualAmountChange || 0,
            consignAmount: options.consignAmountChange || 0,
            strategyId: options.strategyId
        };
        strategyPlanLog.strategys.push(planStrategy);
        debug(`actualAmountChange: ${options.actualAmountChange || 0 }`)
    }
    strategyPlanLog = await strategyPlanLog.save();
    planStrategy = strategyPlanLog.strategys.find(p => p.strategyId.toString() == options.strategyId.toString());
    debug(`actualAmount value: ${planStrategy.actualAmount}`)
}