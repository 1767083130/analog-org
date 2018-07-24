'use strict';

const mongoose = require('mongoose');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');
const TransferStrategy = mongoose.model('TransferStrategy');
const ExchangeException = mongoose.model('ExchangeException');
const Transfer = mongoose.model('Transfer');
const StrategyPlan = mongoose.model('StrategyPlan');
const StrategyPlanLog = mongoose.model('StrategyPlanLog');
const Order =  mongoose.model('Order');
const Decimal = require('decimal.js');
const BaseStrategyRunner = require('./baseStrategyRunner');
const fs= require('fs');
const path = require('path');

const orderLib = require('../order');
const account = require('../account');
const clientIdentifier = require('../clientIdentifier');
const debug = require('debug')('analog:lib:transferStrategys:transferController');

let transferController = new class {
    constructor(){
    }

    /**
     * 执行平台之间的差价操作策略
     * 
     * @param {strategy} strategy 交易策略
     * @param {Object} [options] 附带的参数
     * @param {StrategyPlan} [options.strategyPlanLog]  交易策略所属的策略
     * @param {Object} [options.env] 运行的环境变量。e.g { userName: strategyPlan.userName }
     * @returns { isSuccess: false, message:""}
     */
    async runStrategy(strategy,options){
        let instance = BaseStrategyRunner.getInstance(strategy.strategyType);
        return await instance.runStrategy(strategy,options);
    }

    /**
     * 获取符合条件表达式的交易数量以及价格等信息
     * @param {string} condition
     * @param {String} strategyType 平台之间差价策略类型,如 normal\between等
     * @param {Object} envOptions 
     * @param {Object} envOptions.depths: 市场币种价格。为空时，会自动获取当前市场的币种价格
     * @param {Array} envOptions.accounts: 账户信息。为空时会自动获取env.userName的账户信息。
     *                         当变量是关于账户信息的，accounts、env两者不能全为空
     * @param {Object} envOptions.env,环境变量. e.g. { userName: "lcm" }
     * @Returns 返回。 .e.g.
     *{
            symbol: variableObj.symbol,
            site: variableObj.site,
            operateType: variableObj.operateType,
            amount: amount,
            price: price
        }
     *
     * @public
     */
    async getConditionResult(condition,strategyType,envOptions){
        let instance = BaseStrategyRunner.getInstance(strategyType);
        return await instance.getConditionResult(condition,envOptions);
    }

    async getNecessaryDataType(strategy){
        let instance = BaseStrategyRunner.getInstance(strategy.strategyType);
        return await instance.getNecessaryDataType(strategy);
    }

    /**
     * 订单状态变更处理函数
     * @param {Object} apiOrder e.g  {
     *  outerId: apiOrder.id,
        symbol: common.getApiSymbol(apiOrder.symbol,true),
        type: type, //“LIMIT”, “MARKET”, “STOP”, “TRAILING_STOP”, “EXCHANGE_MARKET”, “EXCHANGE_LIMIT”, “EXCHANGE_STOP”, “EXCHANGE_TRAILING_STOP”, “FOK”, “EXCHANGE_FOK”
        status: status,//status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                        //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                        //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
        dealAmount: apiOrder.amount, //已处理数量
        amount: apiOrder.amountOrig, //已委托数量
        created: +apiOrder.mtsCreate,
        price: apiOrder.price,
        avgPrice: apiOrder.priceAvg,
        hidden: apiOrder.hidden,
        maker: apiOrder.maker }
     * 
     */
    async renewApiOrder(apiOrder){
        let realDealAmount = orderLib.getRealAmount(apiOrder.dealAmount,apiOrder.avgPrice || apiOrder.price,apiOrder.symbol,apiOrder.unit);
        let realAmount = orderLib.getRealAmount(apiOrder.amount,apiOrder.price || apiOrder.avgPrice,apiOrder.symbol,apiOrder.unit);

        let order = await Order.findOneAndUpdate({ 
            outerId: apiOrder.outerId,
            site: apiOrder.site,
            reason: 'transfer'
        },{
            $set: { 
                consignAmount: realAmount,
                bargainAmount: realDealAmount,
                status: apiOrder.status,
                apiStatus: apiOrder.status,
                modified: new Date()
            }
        }, {
            new: false
        });
        if(!order) return;

        let stepAmount = new Decimal(realDealAmount).minus(order.bargainAmount).toNumber(); //更改帐户的金额
        let realUnDealAmount = order.consignAmount - realDealAmount;

        //处理修改价格未完成的委托
        if(apiOrder.status == 'canceled'  && order.waitCreateChild //如果是修改价格未完成的委托
           && order.apiStatus !== 'canceled' ){ //排除已经处理过的，避免重复处理
            debug(`if(apiOrder.status == 'canceled' && order.waitCreateChild){`);
            order = await Order.findOneAndUpdate({
                outerId: apiOrder.outerId,
                site: apiOrder.site 
            },{
                $set: { 
                    waitCreateChild: false
                }
            },{
                new: true
            });
            if(order){
                await orderLib.createChildOrder(order);
            }
        }

        let transferStrategyLog = await TransferStrategyLog.findOne({_id: order.actionId });
        let transferStrategy = await TransferStrategy.findOne({ _id: transferStrategyLog.strategyId });
        
        let strategyPlanLog;
        if(transferStrategyLog.strategyPlanLogId){
            if(order.operateId == 1){ //必须是策略的第一步才更改计划相关的金额
                strategyPlanLog = await StrategyPlanLog.findOne({ _id: transferStrategyLog.strategyPlanLogId });
                if(strategyPlanLog){
                    //委托结束的时候，纠正计划已委托数量
                    if(['canceled','success','failed'].indexOf(apiOrder.status) != -1  //订单是否已经结束
                        &&  ['canceled','success','failed'].indexOf(order.apiStatus) == -1 ){ //防止系统重复数据问题，导致重复提交问题
                        let planOptions = {
                            strategyId: transferStrategy._id,
                            //actualAmountChange: Math.abs(stepAmount)
                        };
                        planOptions.consignAmountChange = -Math.abs(realUnDealAmount);
                        await BaseStrategyRunner.updateStrategyPlanAmount(strategyPlanLog,planOptions);
                        debug(`updateStrategyPlanAmount_3 status:${order.status} consignAmountChange: ${planOptions.consignAmountChange}`)
                    } 
                }
            } else {
                let maxOperateId = 0;
                transferStrategyLog.operates.forEach(element => {
                    if(element.orgOperate.id > maxOperateId){
                        maxOperateId = element.orgOperate.id;
                    }
                });
                if(order.operateId == maxOperateId){
                    strategyPlanLog = await StrategyPlanLog.findOne({ _id: transferStrategyLog.strategyPlanLogId });
                    if(strategyPlanLog){
                        let planOptions = {
                            strategyId: transferStrategy._id,
                            actualAmountChange: Math.abs(stepAmount)
                        };
                        await BaseStrategyRunner.updateStrategyPlanAmount(strategyPlanLog,planOptions);
                        debug('updateStrategyPlanAmount_4')
                    }
                }
            }
        }

        let currentLogOperate = transferStrategyLog.operates.find(function(value){
            return value.orgOperate.id.toString() == order.operateId.toString();
        });
        let currentOperate = currentLogOperate.orgOperate;

        //更改金额
        currentLogOperate.actualAmount = new Decimal(currentLogOperate.actualAmount || 0).plus(stepAmount).toNumber(); //实际转币或成交金额
        currentLogOperate.undeal = new Decimal(currentLogOperate.undeal || 0).plus(stepAmount).toNumber(); //这一步已经执行完成,但是下一步未处理的金额 
        
        //余下未完成交易的数额
        let leftAmount = new Decimal(currentLogOperate.totalAmount).minus(currentLogOperate.actualAmount).toNumber();

        if(currentOperate.nextOperate && currentOperate.nextOperate > 0){ //如果有下一步
            let nextOperate = transferStrategy.operates.find(function(value){
                return value.id == currentOperate.nextOperate;
            });
            let nextLogOperate = transferStrategyLog.operates.find(function(value){
                return value.orgOperate.id == currentLogOperate.orgOperate.nextOperate;
            });
            nextLogOperate.transferStrategyLog = transferStrategyLog;

            var run = false, //是否需要执行
                operateStatus = 'part_success'; 
            //判断是否可以进行下一步操作
            if(currentOperate.batchMin >= 0){ //能分批 
                let waitEnough = (currentOperate.batchWait <= 0    //满足分批的等待时间
                    || +currentLogOperate.startTime <= +new Date() - currentOperate.batchWait * 1000)
                if( (Math.abs(currentLogOperate.undeal) >= Math.abs(currentOperate.batchMin)) //满足分批的金额
                    && waitEnough){ //满足分批的等待时间
                    run = true;
                } 

                //还有一种情况可以执行分批:
                //余下未完成交易的数额已经很小,不能满足下次分批操作,这样的零头忽略
                if( Math.abs(leftAmount) < Math.abs(currentOperate.batchMin) && waitEnough){
                    run = true;
                    operateStatus = 'success';
                }
            } else { //不能分批,则当前操作必须全部执行完成
                //nothing to do
            }

            if(leftAmount == 0){ //当前操作全部执行完成
                run = true;
                operateStatus = 'success';
            }

            //更改操作状态
            currentLogOperate.status = operateStatus;
            
            if(nextOperate){
                if(run){
                    try {
                        if(nextLogOperate.action == 'transfer'){
                            //如果是转币操作，这里需要记录转币前账户余额，方便后面判断是否转币到帐
                            //todo 这里应该可以用更好的办法
                            let siteAccount = account.getSiteAccount(transferStrategyLog.userName,nextLogOperate.site,false);
                            let accountAmount = siteAccount.getTotal(nextLogOperate.symbol);
                            nextLogOperate.accountAmount = accountAmount;
                        }

                        if(Math.abs(stepAmount) > 0){
                            let times = Math.abs(nextOperate.orderAmount / currentOperate.orderAmount);
                            stepAmount = (nextOperate.orderAmount > 0 ? Math.abs(stepAmount) : -Math.abs(stepAmount)) * times;
                            let options = {
                                //identifier: e.identifier,
                                stepAmount: stepAmount,
                                apiOrder: apiOrder
                            };

                            let runOperateRes = await this.runOperate(nextLogOperate,options);
                            if(runOperateRes.isSuccess){
                                currentLogOperate.undeal = 0;
                            } 
                        }
                    } catch(err){
                        console.log(err);
                    }
                }
            }
        } else { //没有下一步了
            if(Math.abs(leftAmount) <= 0){ //当前操作全部执行完成
                currentLogOperate.status = 'success';
            }
        }

        //检测是否可以结束此次策略的运行
        let notSuccessOperate = transferStrategyLog.operates.find(function(value){
            return value.status != 'success';
        });

        if(!notSuccessOperate){ //所有步都已经全部完成
            transferStrategyLog.status = 'success';
        }

        await transferStrategyLog.save();
    }

    /**
     * 执行操作
     * 
     * @param {operate} operate
     * @param {identifier} ClientIdentifier
     * @returns {[Order]} 
     * @public
     */
    async runOperate(operateLog,options){
        let res;
        if(operateLog.orgOperate.action == "trade"){
            // * @param {Object} options
            // * @param {ClientIdentifier} [options.identifier], 可为空
            // * @param {Number} options.stepAmount,差价策略每次委托金额
            // * @param {Array} [options.depths] 市场深度
            res = await orderLib.runOrderOperate(operateLog,options)
        } else if(operateLog.orgOperate.action == "transfer"){
            res = await transfer.runTransferOperate(operateLog,options);
        } else {
            res = { isSuccess:false, message: `不能识别的操作:${operateLog.orgOperate.action}`,errorCode: '200000' }
        }

        return res;
    }

    async finishTransferStep(operateLog){
        if(operateLog.actionIds.length == 0){
            return { isSuccess: false,errorCode: 200000, message:`转币操作还没有执行，不能更改状态！`  };
        }

        if(operateLog.actionIds.length > 1){
            return { isSuccess: false,errorCode: 200000,message:`系统错误，策略交易中转币操作被分成多步执行`  };
        }

        let actionId = operateLog.actionIds[0];
        let transferModel = await Transfer.findOne({ _id: actionId });
        await transfer.finishTransfer(transferModel);

        let res = {
            isSuccess: true,
            transfer: transferModel
        };
        return res;
    }

    async onTransferStatusChanged(e){
        if(!e.transfer || e.transfer.status != 'success'){
            return;
        }


        let identifier = e.identifier;
        if(!identifier){
            identifier = await clientIdentifier.getUserClient(e.order.userName,e.order.site);
        }
        
        if(!identifier){
            debug(`未找到identifier`);
            return;
        }

        let transferStrategyLog = await TransferStrategyLog.findOne({_id: e.transfer.actionId });
        if(!transferStrategyLog){
            //todo 应当记录错误日志
            debug('系统错误。transferStrategyLog为空');
            return;
        }

        let transferStrategy = await TransferStrategy.findOne({ _id: transferStrategyLog.strategyId });
        if(!transferStrategy){
            //todo 应当记录错误日志
            debug('系统错误。transferStrategy为空');
            return;
        }

        let currentLogOperate = transferStrategyLog.operates.find(function(value){
            return value.id.toString() == e.order.operateId.toString();
        });
        if(!currentLogOperate){
            //todo 应当记录错误日志 
            debug('系统错误。transferStrategy为空');
            return;
        }
        let currentOperate = currentLogOperate.orgOperate;

        //更改未处理金额
        currentLogOperate.actualAmount = e.transfer.consignAmount;

        if(currentOperate.nextOperate && currentOperate.nextOperate > 0){ //如果有下一步
            let nextOperate = transferStrategy.operates.find(function(value){
                return value.id == currentOperate.nextOperate;
            });
            let nextLogOperate = transferStrategyLog.operates.find(function(value){
                return value.orgOperate.id == currentLogOperate.orgOperate.nextOperate;
            });
            nextLogOperate.transferStrategyLog = transferStrategyLog;

            var  operateStatus = 'success'; 

            //更改操作状态
            currentOperate.status = operateStatus;

            if(nextOperate){
                try {
                    let runOperateRes = await this.runOperate(nextLogOperate,identifier,e.transfer.consignAmount);
                    if(runOperateRes.isSuccess){
                        currentLogOperate.undeal = 0;
                    } else {
                        currentLogOperate.undeal = new Decimal(currentLogOperate.undeal).plus(e.transfer.consignAmount).toNumber();
                    }
                } catch(err){
                    console.log(err);
                }
            }
        } 

        //检测是否可以结束此次策略的运行
        let notSuccessOperate = transferStrategyLog.operates.find(function(value){
            return value.status != 'success';
        });

        if(!notSuccessOperate){ //所有步都已经全部完成
            transferStrategyLog.status = 'success';
        }

        await transferStrategyLog.save();
    }

    async onTransferDelayed(e){
        let transfer = e.transfer;
        if(!transfer || transfer.status == 'success'  || e.timeDelayed < 30 * 60 * 1000){ //被延迟30分钟
            return;
        }

        //todo 需要确认延迟多久
        let exchangeException = new ExchangeException({
            userName: transfer.userName,
            exchangeType: "transfer", //市场行为类型
            site: transfer.site,
            actionId: transfer._id, //orderId or transferId
            operateId: transfer.operateId, //transferStrategyLog.operate._id
            status: 0, //0，尚未处理；1，已处理
            //message: String,
            causeCode: "delay", //异常类型
            autoHandle: false,  //是否需要自动处理，否则为人工处理
            handleCode: "cancel" //处理办法.
            //realHandleCode: String,
            //desc: String,
        });
        exchangeException.save();
    }

}();

module.exports = transferController;