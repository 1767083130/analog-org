'use strict';

const mongoose = require('mongoose');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferStrategy =  mongoose.model('TransferStrategy');
const EventEmitter = require('eventemitter2').EventEmitter2;
const Decimal = require('decimal.js');
const transferController = require('./transferStrategys/transferController.js');

let strategyPlan = new class{
    constructor(){
    }

    /**
     * 执行平台之间的差价操作策略。特别注意的是，暂时只支持包含一种策略或两种相逆的策略
     * 
     * @param {StrategyPlan} strategyPlan 交易策略执行计划
     * @returns { isSuccess: false, message:""}
     */
    async runStrategyPlan(strategyPlan){
        //判断策略计划所处的当前状态是否能启动。strategyPlan.status可能的值： wait, running, success, stopped
        // if(strategyPlan.status == 'running'){ 
        //     return { isSuccess: false, message: "策略计划正在运行，不能启动"};
        // }
        if(strategyPlan.status == 'success'){ 
            return { isSuccess: false, message: "策略计划已经运行结束，不能启动"};
        }
        if(strategyPlan.strategys.length > 2){
            return { isSuccess: false, message: "策略计划只能包含1~2个策略"};
        }

        strategyPlan.status = 'running';
        await strategyPlan.save();

        let strategys = [];
        for(let strategyItem of strategyPlan.strategys){
            let strategy = await TransferStrategy.findById(strategyItem.strategyId);
            if(!strategy){
                return {isSuccess: false, message: `找不到需要运行的策略。缺失的策略id为${strategyItem.strategyId.toString()}`}
            }

            //根据金额判断是否需要执行
            let otherStrategyItem = strategyPlan.strategys.find(p => p.strategyId != strategyItem.strategyId);
            if(Math.max(strategyItem.actualAmount,strategyItem.consignAmount)
                + strategyPlan.stepAmount - Math.min(otherStrategyItem.actualAmount, otherStrategyItem.consignAmount) > strategyPlan.totalAmount){
                strategyPlan.status = 'success';
                await strategyPlan.save();
                return { isSuccess: false, message: "策略计划已经达到需要成交的总数，系统已自动关闭计划"};
            }

            //记录满足条件的策略
            let env = { userName: strategyPlan.userName },condition;
            let envOptions = { env: env };     
            if(strategy.conditions){
                condition =  strategy.conditions.join(' && ');
            }
            let conditionResult = await transferController.getConditionResult(condition,strategy.strategyType,envOptions);
            if(!conditionResult.isSuccess){
                return { isSuccess: false, message: conditionResult.message }
            }
            if(conditionResult.fixed && conditionResult.orders.length > 0){
                strategys.push(strategy);
            }
        }

        if(strategys.length > 1){
            return { isSuccess: false, message: `策略计划“${strategyPlan.name}”中存在两种或以上的策略同时满足条件，是一个设计错误的计划`};
        }
        if(strategys.length == 0){
            return { isSuccess: true, fixed: false, message: "策略不满足条件" }
        }

        let strategy = strategys[0];
        let env = { userName: strategy.userName };
        let options = {
            strategyPlan: strategyPlan,
            env:env
        };
        let res = await transferController.runStrategy(strategy,options);
        res.fixed = true;
        return res;
    }

    async stopPlan(strategyPlan){

    }
}();

module.exports = strategyPlan