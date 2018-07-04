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
        //TODO 这里需要考虑并发，执行的时候需要加锁
        //判断策略计划所处的当前状态是否能启动。strategyPlan.status可能的值：init、 wait, running, success, stopped
        if(['wait','running'].indexOf(strategyPlan.status) == -1){ 
            return { isSuccess: false, message: "策略计划已经运行结束或尚未开始，不能启动"};
        }
        // let validStrategys = strategyPlan.strategys.find(p => p.isValid == true);
        // if(validStrategys.length > 2){
        //     return { isSuccess: false, message: "策略计划只能包含1~2个策略"};
        // }

         //统计计划的各个策略执行总额
        if(strategyPlan.type == 'reverse') {
            if(strategyPlan.strategys.length != 2){
                return { isSuccess: false, message: `策略计划类型为“reverse”时，策略总数必须为2`};
            }
      
            for(let strategyItem of strategyPlan.strategys){
                let otherStrategyItem = strategyPlan.strategys.find(p => p.strategyId != strategyItem.strategyId);
                if(otherStrategyItem) {
                    if(Math.max(strategyItem.actualAmount,strategyItem.consignAmount)
                        + strategyPlan.stepAmount - Math.min(otherStrategyItem.actualAmount, otherStrategyItem.consignAmount) > strategyPlan.totalAmount){
                        strategyPlan.status = 'success';
                        await strategyPlan.save();
                        willRun = false;
                        return { isSuccess: false, message: `'策略计划"${strategyPlan.name}"已经达到需要成交的总数，系统已自动关闭计划'`};
                    }
                } else {
                    return { isSuccess: false, message: `'策略计划"${strategyPlan.name}"类型为reverse，但是只有一个策略'`};
                }
            }
        } else { //union
            let totalAmount = 0;
            for(let strategyItem of strategyPlan.strategys){
                totalAmount += Math.max(strategyItem.actualAmount,strategyItem.consignAmount);
            }
            if(totalAmount >= strategyPlan.totalAmount){
                strategyPlan.status = 'success';
                await strategyPlan.save();
                return { isSuccess: false, message: `'策略计划"${strategyPlan.name}"已经达到需要成交的总数，系统已自动关闭计划'`};
            }
        }

        strategyPlan.status = 'running';
        await strategyPlan.save();

        let strategys = [];
        for(let strategyItem of strategyPlan.strategys){
            let strategy = await TransferStrategy.findById(strategyItem.strategyId);
            if(!strategy){
                return {isSuccess: false, message: `找不到需要运行的策略。缺失的策略id为${strategyItem.strategyId.toString()}`}
            }
            if(!strategy.isValid){
                continue;
            }

            if(strategy.totalAmount && strategy.totalAmount > 0){
                if(Math.max(strategyItem.actualAmount,strategyItem.consignAmount) > strategy.totalAmount){
                    continue;
                }
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