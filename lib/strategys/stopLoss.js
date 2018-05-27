'use strict';

const mongoose = require('mongoose');
const StopLoss = mongoose.model('StopLoss');
const StopLossLog = mongoose.model('StopLossLog');
const ClientIdentifier  = mongoose.model('ClientIdentifier');

const realTimePrice = require('../realTimePrice');
const order = require('../order');
const transfer = require('../transfer');
const account = require('../account');
const Decimal = require('decimal.js');

let stopLoss = new class{
    constructor(){
    }

    async runStrategy(stepCallBack){
        
        let stopLosses = await StopLoss.find({
            isValid: true,
            lastRunTime: { $lt: +new Date() - 2 * 1000 }, //每隔2秒执行一次
            expired: { $gt: +new Date() }
        }).sort({ userName: -1 });
        
        let res = { isSuccess: true, successNum: 0, failedNum: 0 };
        for(let stopLoss of stopLosses){
            try{
                let stepRes = await this.runStopLoss(stopLoss);

                if(stepRes.isSuccess){
                    res.successNum++;
                }
            }catch(err){
                console.log(err);
                res.failedNum++;
                res.isSuccess = false;
            }

            if(stepCallBack){
                stepCallBack(res);
            }
        }

        return res;
    }

    async runStopLoss(stopLoss){
        for(let step of stopLoss.steps){
            let accountInfo = await account.getSiteAccount(stopLoss.userName,step.site,false);
            if(!accountInfo){
                continue;
            }
            step.stopLoss = stopLoss;
            
            let identifier = await ClientIdentifier.getUserClient(stopLoss.userName,step.site);
            let marketPrice = await this.getMarketPrice();
            let res = await this.getStopLossLog(step,marketPrice,identifier);

            if(res.needStopLoss){
                await this.runStopLossLog(res.stopLossLog,marketPrice,identifier);
            }
        }
    }

    async getStopLossLog(step,marketPrice,identifier){
        let stopLoss = step.stopLoss;

        let stopLossLog = {
            userName: stopLoss.userName,
            site: step.site,
            symbol: step.symbol,
            isTest: false,
            status: 'wait',  
            stopLossStep: step,

            lastRunTime: Date.now(),  //上次运行时间
            created: Date.now(),
            modified: Date.now()
        };

        /*
         执行的条件：
         (1) 往下,
         (2) 往上 
        */

        //todo (1)强制执行止损 (2)止损后重新上涨，弥补止损错误 (3)如果交易未成功 (4) errorCode
        let stopLossStep = stopLossLog.stopLossStep;  
        if(!stopLossStep){
            return { isSuccess: false, message: "系统错误！"};
        }      
                

        if(['wait','delay','retrade'].indexOf(stopLossLog.status) == -1 
           || stopLossLog.expired <= Date.now()){
            return { isSuccess: true } ;
        }

        if(!identifier){
            identifier = await ClientIdentifier.getUserClient(stopLossLog.userName,stopLossLog.site);   
            if(!identifier){
                return { isSuccess: false, message: "系统错误！"};
            }
        }

        // if(!accountInfo){
        //     accountInfo = await account.getSiteAccount(stopLossLog.userName,stopLossLog.site,false);
        //     if(!accountInfo){
        //         return { isSuccess: false, message: "系统错误！"};
        //     }
        // }
        if(!marketPrice){
            marketPrice = await this.getMarketPrice();
        }

        let needStopLoss, //是否需要操作
            operateType = 'none'; //需要进行的操作.可能得值为: 
                                  //none(什么都不干),trade(需要委托交易),delay(需要延迟并等待)
                                  //trail,更改止损价格
        stopLossLog.marketPrice = marketPrice;

        //是否需要执行止损
        needStopLoss =  (stopLossStep.direction == 'up' && stopLossStep.loss < marketPrice) 
             || (stopLossStep.direction == 'down' && stopLossStep.loss > marketPrice);

        if(needStopLoss){ //如果需要执行止损
            //确定需要执行的操作
            if(stopLossLog.status == 'wait'){ 
                if(stopLossStep.delay > 0) { //如果符合止损条件后还需要等待一段时间
                    operateType = 'delay';
                } else {
                    operateType = 'trade';  
                }

            } else if(stopLossLog.status == 'delay'){
                if( +stopLossLog.delayStart + stopLossStep.delay * 60 * 1000 < +Date.now()){ //如果等待时间已满
                    operateType = 'trade';
                }

            } else if(stopLossLog.status == 'retrade'){
                if(+stopLossLog.lastRunTime < +Date.now() + 1 * 1000){ //如果时间离上次执行已经过了1秒 
                    operateType = 'trade';
                }
            }
        } else {
            //
        }


        let res = {isSuccess: true,needStopLoss: needStopLoss };
        if(needStopLoss){
            stopLossLog.lastRunTime = Date.now();
            res.stopLossLog = stopLossLog;
            res.operateType = operateType;
            res.marketPrice = marketPrice;
        }

        return res;
       
    }

    async runStopLossLog(stopLossLog,marketPrice,identifier){
        let consignAmount = 0, //委托交易的数量
            consignPrice = 0;  //委托交易的价格
        let operateType = stopLossLog.operateType;
        let stopLossStep = stopLossLog.stopLossStep;

        if(operateType == 'trade'){ //需要委托交易
            let account = await account.getSiteAccount(stopLossLog.userName,stopLossLog.site,false);
            let symbolAvailable = account.getAvailable(stopLossLog.symbol);
            let symbolTotal =  account.getTotal(stopLossLog.symbol);
            let stepAmount = StopLoss.getStepOrderAmount(symbolTotal,stopLossLog.position); //todo 有点问题,只是考虑了down情况
 
            let leftRange = 100 - stopLossLog.lossRange;
            consignAmount = Math.min(symbolAvailable,stepAmount);
            consignPrice = new Decimal(stopLossStep.loss).times(leftRange).div(100).toNumber();
              //stopLossStep.loss * (100 - stopLossLog.lossRange) / 100; //todo 有点问题,只是考虑了down情况

            let order = { 
                site: stopLossLog.site,
                userName: stopLossLog.userName, 
                isTest: stopLossLog.isTest,
                autoRetry: false,
                consignAmount: consignAmount,
                price: consignPrice, 
                side: stopLossStep.operateType,
                reason: "stoploss", 
                symbol: stopLossLog.symbol
            };

            let res = await order.createOrder(order);
            if(res.isSuccess){
                stopLossLog.status = 'consign';

            } else {
                stopLossLog.status = 'retrade';
            }

        } else if(operateType == 'delay'){ //需要延迟并等待
            stopLossLog.status = 'delay';
            stopLossLog.delayStart = Date.now(); 

        } else if(operateType == 'trail'){ //更改止损价格
            let newLoss = new Decimal(marketPrice).minus(stopLossStep.startPrice).times(stopLossStep.trailingRange).toNumber();
                            //(marketPrice - stopLossStep.startPrice) * stopLossStep.trailingRange; //todo 也许这里需要一个精确点
            let newLog = {
                _id: null,
                status: 'wait',
                loss: newLoss,
                //nextId: { type: Schema.ObjectId },
                previousId: stopLossLog._id,
                created: Date.now(),
                modified: Date.now()
            };
            newLog = Object.assign({},stopLossLog, newLog);

            let newLogModel = new StopLossLog(newLog);
            newLogModel = await newLogModel.save();

            stopLossLog.status = 'renew';
            stopLossLog.nextId = newLogModel._id;

        } 

        return stopLossLog;
    }

    async getMarketPrice(){
        let realPrice = await realTimePrice.getRealPrice(stopLossLog.site,stopLossLog.symbol);
        if(!realPrice){
            return { isSuccess: false, errorCode: "100004", message: "获取行情信息失败" };
        }

        marketPrice = realPrice.bids[0];
    }

    /**
     * 订单状态变更处理函数
     * @param {Object} e,参数，至少要有两个字段.e.g. 
     *  { order: refreshOrder, //变更后的订单
     *     changeAmount: 23 } //变更的额度
     * 
     */
    async onOrderStatusChanged(e){
        if(e.order.reason != 'stoploss'){
            return;
        }

        //todo
    }

    async onOrderDelayed(e){
        if(e.order.reason != 'stoploss'){
            return;
        }

        //todo
        if(true){
        
        }
    }

}();

module.exports = stopLoss;

