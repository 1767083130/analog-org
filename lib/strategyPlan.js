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

        let runPlanContinue = true, //任务是否继续运行
            runPlanRes; //返回的最终运行结果
        try{
            strategyPlan.lastRunTime = Date.now();
            strategyPlan.status = 'running';
            await strategyPlan.save();

            let strategysId = [];
            strategyPlan.strategys.forEach(element => {
                strategysId.push(element.strategyId);
            });

            let planStrategys = await TransferStrategy.find({ _id: {$in: strategysId},isValid: true });
            if(strategysId.length != planStrategys.length){
                runPlanContinue = false;
                runPlanRes = { isSuccess: false, fixed: false, message: "计划中的策略有可能被删除" }
            }

            if(!runPlanContinue){
                strategyPlan.status = 'wait';
                await strategyPlan.save();
                return runPlanRes;
            }

            let strategys = []; //满足条件，需要下一步运行的策略
            let totalAmount = 0; //任务的全部策略已经执行数量总和
            for(let strategyItem of strategyPlan.strategys){
                let willRunStrategy = true; //当前策略是否需要运行
                let strategy = planStrategys.find(p => p._id.toString() == strategyItem.strategyId.toString());
                if(strategy.relatedStrategy){ //设置了平仓策略的策略
                    let relatedStrategy = planStrategys.find(p => p._id.toString() == strategy.relatedStrategy.toString());
                    if(strategy.direction == 1){
                        let actualAmount = strategy.actualAmount - relatedStrategy.actualAmount;
                        let consignAmount = strategy.consignAmount - relatedStrategy.consignAmount;

                        totalAmount += Math.max(actualAmount,consignAmount);
                        if(strategy.totalAmount && strategy.totalAmount > 0){
                            if(Math.max(actualAmount,consignAmount)  >= strategy.totalAmount){
                                willRunStrategy = false;
                            } 
                        }
                    } else { //2
                        if(strategy.consignAmount >= relatedStrategy.actualAmount){ //如果策略运行总量已经达到需要进行平仓策略的量
                            willRunStrategy = false;
                        }
                    }
                } else { //没有设置平仓策略的策略
                    if(strategy.totalAmount && strategy.totalAmount > 0){
                        if(Math.max(strategyItem.actualAmount,strategyItem.consignAmount) >= strategy.totalAmount){
                            willRunStrategy = false;
                        } 
                    }

                    totalAmount += Math.max(strategyItem.actualAmount,strategyItem.consignAmount);
                }

                if(willRunStrategy){
                    //记录满足条件的策略
                    let env = { userName: strategyPlan.userName },condition;
                    let envOptions = { env: env };     
                    if(strategy.conditions){
                        condition =  strategy.conditions.join(' && ');
                    }
                    let conditionResult = await transferController.getConditionResult(condition,strategy.strategyType,envOptions);
                    if(!conditionResult.isSuccess){
                        runPlanContinue = false;
                        runPlanRes = { isSuccess: false, message: conditionResult.message };
                        break;
                    }
                    if(conditionResult.fixed && conditionResult.orders.length > 0){
                        strategys.push(strategy);
                    }
                }
            }

            if(runPlanContinue){
                if(totalAmount + strategyPlan.stepAmount > strategyPlan.totalAmount){
                    strategyPlan.status = 'success';
                    await strategyPlan.save();
                    return { isSuccess: false, message: `'策略计划"${strategyPlan.name}"已经达到需要成交的总数，系统已自动关闭计划'`};
                }

                if(strategys.length > 1){
                    runPlanContinue = false;
                    runPlanRes = { isSuccess: false, message: `策略计划“${strategyPlan.name}”中存在两种或以上的策略同时满足条件，是一个设计错误的计划`};
                }
                if(strategys.length == 0){
                    runPlanContinue = false;
                    runPlanRes = { isSuccess: true, fixed: false, message: "策略不满足条件" }
                }

                if(runPlanContinue){
                    let strategy = strategys[0];
                    let env = { userName: strategy.userName };
                    let options = {
                        strategyPlan: strategyPlan,
                        env:env
                    };
                    runPlanRes = await transferController.runStrategy(strategy,options);
                    runPlanRes.fixed = true;
                }
            }

            strategyPlan.status = 'wait';
            await strategyPlan.save();
            
        } catch (ex){
            runPlanRes = { isSuccess: false, fixed: false, message: "发生系统错误" }
            strategyPlan.status = 'wait';
            await strategyPlan.save();

            console.error(ex);
        }

        return runPlanRes;
    }
}();

module.exports = strategyPlan