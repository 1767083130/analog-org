'use strict';

const mongoose = require('mongoose');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferStrategy =  mongoose.model('TransferStrategy');
const StrategyPlanLog = mongoose.model('StrategyPlanLog');
const StrategyPlan = mongoose.model('StrategyPlan');

const EventEmitter = require('eventemitter2').EventEmitter2;
const Decimal = require('decimal.js');
const transferController = require('./transferStrategys/transferController.js');
const clientNetMonitor = require('./apiClient/clientNetMonitor');
const symbolUtil = require('./utils/symbol');

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
        let strategyPlanLog = await this.getStrategyPlanLog(strategyPlan);
        strategyPlanLog.plan = strategyPlan;
        return await this._runStrategyPlan(strategyPlanLog);
    }
    
    /**
     * 执行平台之间的差价操作策略。特别注意的是，暂时只支持包含一种策略或两种相逆的策略
     * 
     * @param {StrategyPlanLog} strategyPlanLog 交易策略执行计划
     * @returns { isSuccess: false, message:""}
     */
    async _runStrategyPlan(strategyPlanLog){
        //TODO 这里需要考虑并发，执行的时候需要加锁
        //判断策略计划所处的当前状态是否能启动。strategyPlanLog.status可能的值：init、 wait, running, success, stopped
        if(strategyPlanLog.status != 'wait'){ 
            return { isSuccess: false, message: "策略计划已经运行结束或尚未开始，不能启动"};
        }

        let checkRes = await this.hasNecessaryData(strategyPlanLog);
        if(!checkRes.hasFull){
            return { isSuccess: false, message: `网络可能出现中断或系统配置错误，可能获取不到必需的数据: ${JSON.stringify(checkRes)}`}
        }

        let runPlanContinue = true, //任务是否继续运行
            runPlanRes; //返回的最终运行结果
        try{
            strategyPlanLog.lastRunTime = Date.now();
            await this._updatePlanLogStatus(strategyPlanLog,'running');

            let strategysId = [];
            strategyPlanLog.strategys.forEach(element => {
                strategysId.push(element.strategyId);
            });

            let planStrategys = await TransferStrategy.find({ _id: {$in: strategysId},isValid: true }).sort({created: 1});
            if(strategysId.length != planStrategys.length){
                runPlanContinue = false;
                runPlanRes = { isSuccess: false, fixed: false, message: "计划中的策略有可能被删除" }
            }

            if(!runPlanContinue){
                await this._updatePlanLogStatus(strategyPlanLog,'wait');
                return runPlanRes;
            }

            let env = { userName: strategyPlanLog.userName };
            let runStrategyOptions = {
                strategyPlanLog: strategyPlanLog,
                env:env
            };
            let strategys = []; //满足条件，需要下一步运行的策略
            let totalActualAmount = 0, //任务的全部策略已经执行数量总和
                totalConsignAmount = 0; //任务的全部策略已经委托数量总和
            for(let strategyItem of strategyPlanLog.strategys){
                let willRunStrategy = true; //当前策略是否需要运行
                let strategy = planStrategys.find(p => p._id.toString() == strategyItem.strategyId.toString());
                if(strategy.relatedStrategy){ //设置了平仓策略的策略
                    let relatedStrategyItem = strategyPlanLog.strategys.find(p => p.strategyId.toString() == strategy.relatedStrategy.toString())
                    //let relatedStrategy = planStrategys.find(p => p._id.toString() == strategy.relatedStrategy.toString());
                    if(!relatedStrategyItem){
                        runPlanContinue = false;
                        runPlanRes = { isSuccess: false, message:  `系统性错误！在计划"${strategyPlanLog.name}"中找不到策略id为"${strategy.relatedStrategy.toString()}"的策略` };
                        break;
                    }

                    if(strategy.direction == 1){
                        let actualAmount = strategyItem.actualAmount - relatedStrategyItem.actualAmount;
                        let consignAmount = strategyItem.consignAmount - relatedStrategyItem.consignAmount;

                        totalConsignAmount += consignAmount;
                        totalActualAmount += actualAmount;
                        if(strategy.totalAmount && strategy.totalAmount > 0){
                            if(Math.max(actualAmount,consignAmount)  >= strategy.totalAmount){
                                willRunStrategy = false;
                            } 
                        }
                    } else { //2
                        willRunStrategy = false;
                        if(strategyItem.consignAmount < relatedStrategyItem.actualAmount){ //如果策略运行总量已经达到需要进行平仓策略的量
                            let runRes = await transferController.runStrategy(strategy,runStrategyOptions);
                            console.log(JSON.stringify(runRes))
                        }
                    }
                } else { //没有设置平仓策略的策略
                    if(strategy.totalAmount && strategy.totalAmount > 0){
                        if(Math.max(strategyItem.actualAmount,strategyItem.consignAmount) >= strategy.totalAmount){
                            willRunStrategy = false;
                        } 
                    }

                    totalConsignAmount += strategyItem.consignAmount;
                    totalActualAmount += strategyItem.actualAmount;
                }

                if(willRunStrategy){
                    //记录满足条件的策略
                    let env = { userName: strategyPlanLog.userName },condition;
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
                if(totalActualAmount + strategyPlanLog.stepAmount > strategyPlanLog.totalAmount){
                    await this._updatePlanLogStatus(strategyPlanLog,'success');
                    return { isSuccess: false, message: `'策略计划"${strategyPlanLog.name}"的总成交数量已经达到需要成交的总数，系统已自动关闭计划'`};
                }
                if(totalConsignAmount + strategyPlanLog.stepAmount > strategyPlanLog.totalAmount){
                    await this._updatePlanLogStatus(strategyPlanLog,'wait');
                    return { isSuccess: false, message: `'策略计划"${strategyPlanLog.name}"的总委托数量已经达到需要成交的总数'`};
                }

                if(strategys.length == 0){
                    runPlanContinue = false;
                    runPlanRes = { isSuccess: true, fixed: false, message: "所有策略不满足条件或额度受限" }
                }

                //TODO 如果需要支持递进式建仓，这里需要修改
                if(runPlanContinue){
                    let strategy = strategys[0];
                    runPlanRes = await transferController.runStrategy(strategy,runStrategyOptions);
                    runPlanRes.fixed = true;
                }
            }
            await this._updatePlanLogStatus(strategyPlanLog,'wait');
            
        } catch (ex){
            runPlanRes = { isSuccess: false, fixed: false, message: "发生系统错误" }
            await this._updatePlanLogStatus(strategyPlanLog,'wait');

            console.error(ex);
        }

        return runPlanRes;
    }

    async _updatePlanLogStatus(strategyPlanLog,status){
        strategyPlanLog.status = status;
        strategyPlanLog.plan.status = status;
        await strategyPlanLog.save();
        await strategyPlanLog.plan.save();
    }

        /**
     * 更改策略计划中的金额
     * @param {*} strategyPlanLog 策略计划Log
     * @param {*} options 需要变更的金额
     * @param {*} options.strategyId 策略_Id
     * @param {Number} [options.actualAmountChange] 实际已成交数量的变更额度，比如2,表示成交2个对应的交易品种
     * @param {Number} [options.consignAmountChange] 实际已委托数量的变更额度，比如2,表示委托2个对应的交易品种，但有可能尚未成交（也有可能已成交）
     */
    async updateStrategyPlanAmount(strategyPlanLog,options){
        if(!options.strategyId){
            throw new Error(`参数options.strategyId不能为空`);
        }

        strategyPlanLog.strategys = strategyPlanLog.strategys || [];
        let planStrategy = strategyPlanLog.strategys.find(p => p.strategyId.toString() == options.strategyId.toString());
        if(planStrategy){
            if(options.actualAmountChange){
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
        }
        await strategyPlanLog.save();
    }
    
    async runStrategyPlanLog(strategyPlanLog){
        //判断策略计划所处的当前状态是否能启动。strategyPlanLog.status可能的值：init、 wait, running, success, stopped
        if(strategyPlanLog.status != 'wait'){ 
            return { isSuccess: false, message: "计划实例已经运行结束或尚未开始，不能启动"};
        }

        let runPlanContinue = true, //任务是否继续运行
            runPlanRes; //返回的最终运行结果
        try{
            strategyPlanLog.lastRunTime = Date.now();
            strategyPlanLog.status = 'running';
            await strategyPlanLog.save();

            let strategysId = [];
            strategyPlanLog.strategys.forEach(element => {
                strategysId.push(element.strategyId);
            });

            let planStrategys = await TransferStrategy.find({ _id: {$in: strategysId},isValid: true }).sort({created: 1});
            if(strategysId.length != planStrategys.length){
                runPlanContinue = false;
                runPlanRes = { isSuccess: false, fixed: false, message: "计划中的策略有可能被删除" }
            }

            if(!runPlanContinue){
                strategyPlanLog.status = 'wait';
                await strategyPlanLog.save();
                return runPlanRes;
            }

            let env = { userName: strategyPlanLog.userName };
            let runStrategyOptions = {
                strategyPlanLog: strategyPlanLog,
                env:env
            };

            for(let strategyItem of strategyPlanLog.strategys){
                let strategy = planStrategys.find(p => p._id.toString() == strategyItem.strategyId.toString());
                if(strategy.relatedStrategy){ //设置了平仓策略的策略
                    let relatedStrategyItem = strategyPlanLog.strategys.find(p => p.strategyId.toString() == strategy.relatedStrategy.toString())
                    //let relatedStrategy = planStrategys.find(p => p._id.toString() == strategy.relatedStrategy.toString());
                    if(!relatedStrategyItem){
                        runPlanContinue = false;
                        runPlanRes = { isSuccess: false, message:  `系统性错误！在计划"${strategyPlanLog.name}"中找不到策略id为"${strategy.relatedStrategy.toString()}"的策略` };
                        break;
                    }

                    if(strategy.direction != 1){
                        willRunStrategy = false;
                        if(strategyItem.consignAmount < relatedStrategyItem.actualAmount){ //如果策略运行总量已经达到需要进行平仓策略的量
                            let runRes = await transferController.runStrategy(strategy,runStrategyOptions);
                            console.log(JSON.stringify(runRes))
                        }
                    }
                } 
            }

            strategyPlanLog.status = 'wait';
            await strategyPlanLog.save();
        } catch (ex){
            runPlanRes = { isSuccess: false, fixed: false, message: "发生系统错误" }
            strategyPlanLog.status = 'wait';
            await strategyPlanLog.save();

            console.error(ex);
        }

        return runPlanRes;
    }

    /**
     * 重置策略计划
     * @param {*} strategyPlan 需要重置的策略计划
     * @param {String} [status] 重置后新的状态，默认为 'init' 
     * @returns 返回新的策略计划
     */
    async resetStrategyPlan(strategyPlan,status){
        status = status || 'init';

        //生成策略副本
        let strategyIds = [];
        strategyPlan.strategys.forEach(p => strategyIds.push(p.strategyId));
        let planStrategys = await TransferStrategy.find({ _id: {$in: strategyIds},isValid: true });

        let newStrategyIds = [];
        for(let i = 0; i < planStrategys.length; i++ ){
            let oldStrategy = planStrategys[i];

            let newDoc = this.deepCopy(oldStrategy._doc);
            delete newDoc._id;
            let transferStrategy = new TransferStrategy(newDoc);
            let newStrategy = await transferStrategy.save();
            newStrategyIds.push({ strategyId: newStrategy._id});
        }
       
        //重置任务状态
        strategyPlan.currentLog = null;
        strategyPlan.strategys = newStrategyIds;
        strategyPlan.status = status;
        for(let strategy of strategyPlan.strategys){
            strategy.consignAmount = 0;
            strategy.actualAmount = 0;
        }
       
        let newPlanLog = await this.refreshStrategyPlanLog(strategyPlan,true);
        strategyPlan.currentLog = newPlanLog._id;
        let newPlan = await strategyPlan.save();

        return newPlan;
    }

    async hasNecessaryData(strategyPlanLog){
        let strategysId = [];
        strategyPlanLog.strategys.forEach(element => {
            strategysId.push(element.strategyId);
        });

        let strategys = await TransferStrategy.find({ _id: {$in: strategysId} });
        let hasFull = true, lackDataType = null;
        for(let i = 0; i < strategys.length; i++){
            let dataTypes = await transferController.getNecessaryDataType(strategys[i]);
            for(let dataType of dataTypes){
                let symbolParts = symbolUtil.getSymbolParts(dataType.symbol,dataType.site);
                let clientType = (symbolParts.contractType == 'futures' ? 'futures' : 'spot');
                let isPublicChannelNormal = clientNetMonitor.checkNormal(dataType.site,clientType,'pong');
                if(!isPublicChannelNormal){
                    hasFull = false;
                    lackDataType = { site: dataType.site, clientType: clientType, type: 'pong' };
                    break;
                }

                let isPrivateChannelNormal = clientNetMonitor.checkNormal(dataType.site,clientType,'auth-pong');
                if(!isPrivateChannelNormal){
                    hasFull = false;
                    lackDataType = { site: dataType.site, clientType: clientType, type: 'auth-pong' };
                    break;
                }
            }

            if(!hasFull){
                break;
            }
        } 
        
        return { hasFull: hasFull, lackDataType: lackDataType };
    }
    
    async getStrategyPlanLog(strategyPlan,upinsert = true){
        let strategyPlanLog = await StrategyPlanLog.findById(strategyPlan.currentLog);    
        if(!strategyPlanLog && upinsert) {
            strategyPlanLog = new StrategyPlanLog({
                userName: strategyPlan.userName, 
                name: strategyPlan.name, 
                desc: strategyPlan.desc, 
                strategys: strategyPlan.strategys,
                
                planId:  strategyPlan._id, 
                isValid: strategyPlan.isValid,
                isSimple: strategyPlan.isSimple,  //是否为简单模式
                status: strategyPlan.status,
                stepAmount: strategyPlan.stepAmount,  //每步执行数量
                totalAmount: strategyPlan.totalAmount, //需要执行总量。 -1，表示直到满仓为止
                //lastRunTime: new Date(), //上次执行时间
                interval: strategyPlan.interval, //两次执行的间隔时间，单位为ms
                startTime: strategyPlan.startTime,
                endTime: strategyPlan.endTime,
                created: new Date(),
                modified: new Date()
            });
            strategyPlanLog = await strategyPlanLog.save();

            strategyPlan.currentLog = strategyPlanLog._id;
            await strategyPlan.save();
        }

        return strategyPlanLog;
    }

    /**
     * 同步策略计划当前运行实例(StrategyPlanLog)的值,使其与策略计划保持一致
     * @param {StrategyPlan} strategyPlan 需要进行同步的策略计划
     * @param {Boolean} upinsert 是否在没有当前运行实例的情况下自动添加实例。默认为false
     * @returns 返回策略计划当前运行实例
     */
    async refreshStrategyPlanLog(strategyPlan,upinsert = true){
        let strategyPlanLog = await this.getStrategyPlanLog(strategyPlan,upinsert);

        strategyPlanLog.userName = strategyPlan.userName;
        strategyPlanLog.name = strategyPlan.name;
        strategyPlanLog.desc = strategyPlan.desc;

        let strategys = [];
        for(let strategyItem of strategyPlan.strategys){
            let strategyLogItem = strategyPlanLog.strategys.find(p => p.strategyId.toString() == strategyItem.strategyId.toString());
            if(strategyLogItem){
                strategys.push({
                    strategyId: strategyItem.strategyId,
                    consignAmount: strategyLogItem.consignAmount, //已执行委托但尚未完成的数量.必须为大于0的数。
                    actualAmount: strategyLogItem.actualAmount, //已执行完成的数量.必须为大于0的数
                })
            } else {
                strategys.push({
                    strategyId: strategyItem.strategyId,
                    consignAmount: 0,
                    actualAmount: 0
                });
            }
        }
        strategyPlanLog.strategys = strategys;
        
        strategyPlanLog.planId = strategyPlan._id;
        strategyPlanLog.isValid = strategyPlan.isValid;
        strategyPlanLog.isSimple = strategyPlan.isSimple;  //是否为简单模式
        strategyPlanLog.status = strategyPlan.status;
        strategyPlanLog.stepAmount = strategyPlan.stepAmount;  //每步执行数量
        strategyPlanLog.totalAmount = strategyPlan.totalAmount; //需要执行总量。 -1，表示直到满仓为止
        //lastRunTime: new Date(), //上次执行时间
        strategyPlanLog.interval = strategyPlan.interval; //两次执行的间隔时间，单位为ms
        strategyPlanLog.startTime = strategyPlan.startTime;
        strategyPlanLog.endTime = strategyPlan.endTime;
        strategyPlanLog.modified = new Date();
        
        let newer = await strategyPlanLog.save();
        return newer;
    }

    /**
     * 获取策略计划运行实例的运行情况
     * @param {StrategyPlan} strategyPlan 需要进行同步的策略计划
     * @returns 返回策略计划运行实例的运行情况。 e.g {
     *   totalConsignAmount: 0,  //任务计划已委托数量
     *   totalActualAmount: 0    //任务计划已成交数量
     *}
     */
    async getStrategyPlanLogRunInfo(strategyPlanLog){
        let logRunInfo = {
            totalConsignAmount:  0,  //任务计划已委托数量
            totalActualAmount:   0   //任务计划已成交数量
        };

        let strategysId = [];
        strategyPlanLog.strategys.forEach(element => {
            strategysId.push(element.strategyId);
        });

        let planStrategys = await TransferStrategy.find({ _id: {$in: strategysId},isValid: true });
        if(strategysId.length != strategyPlanLog.strategys.length){
            return logRunInfo;
        }

        //计算计划和计划的单步策略已委托和已成交数量
        let consignAmounts = [0], //计划的每个策略分别已委托数量
            actualAmounts = [0];  //计划的每个策略分别已成交数量
        for(let strategyItem of strategyPlanLog.strategys){
            let strategy = planStrategys.find(p => p._id.toString() == strategyItem.strategyId.toString());
            if(strategy.relatedStrategy){ //设置了平仓策略的策略
                let relatedStrategyItem = strategyPlanLog.strategys.find(p => p.strategyId.toString() == strategy.relatedStrategy.toString())
                if(!relatedStrategyItem){
                    return logRunInfo;
                }

                if(strategy.direction == 1){
                    let consignAmount = strategyItem.consignAmount - relatedStrategyItem.consignAmount;
                    let actualAmount = strategyItem.actualAmount - relatedStrategyItem.actualAmount;
                    consignAmounts.push(consignAmount);
                    actualAmounts.push(actualAmount);
                } else { //2
                    //不需要进行任何处理
                }
            } else {
                consignAmounts.push(strategyItem.consignAmount);
                actualAmounts.push(strategyItem.actualAmount);
            }
        }

        let totalConsignAmount = 0,
            totalActualAmount = 0;
        for(let i = 0; i < consignAmounts.length; i++){
            totalConsignAmount += consignAmounts[i];
            totalActualAmount += actualAmounts[i];
        }

        logRunInfo.totalConsignAmount = totalConsignAmount;
        logRunInfo.totalActualAmount = totalActualAmount;

        return logRunInfo;
    }

    deepCopy(obj){
        if(typeof obj != 'object'){
            return obj;
        }
        var newobj = {};
        for ( var attr in obj) {
            newobj[attr] = obj[attr]; //this.deepCopy(obj[attr]);
        }
        return newobj;
    }

}();

module.exports = strategyPlan