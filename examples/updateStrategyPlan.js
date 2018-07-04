
'use strict';
const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');
const StrategyPlan = mongoose.model('StrategyPlan');
const Decimal = require('decimal.js');
const Order = mongoose.model('Order');

testUpdatePlan();

async function testUpdatePlan(){
    let sOrderId = '5b3f67249809e82984a3a71a';
    let orderId = mongoose.Types.ObjectId(sOrderId);
    let order = await Order.findById(orderId);

    let strategyPlan = await StrategyPlan.findById(order.strategyPlanId);
    let strategyLog = await TransferStrategyLog.findById(order.actionId);
    if(strategyPlan && strategyLog){
        let planStrategyItem = strategyPlan.strategys.find(p => p.strategyId.toString() == strategyLog.strategyId.toString());
        if(planStrategyItem){
            planStrategyItem.consignAmount = new Decimal(planStrategyItem.consignAmount).minus(order.consignAmount).plus(order.bargainAmount).toNumber();
        }

        let operateLog = strategyLog.operates.find(p => p.orgOperate.id == order.operateId);
        if(operateLog){
            operateLog.consignAmount = new Decimal(operateLog.consignAmount).minus(order.consignAmount).plus(order.bargainAmount).toNumber();
        }

        await strategyPlan.save();
        await strategyLog.save();
    }
}