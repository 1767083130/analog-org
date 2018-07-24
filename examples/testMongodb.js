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
