'use strict';

const apiConfigUtil = require('../apiClient/apiConfigUtil');
const symbolUtil = require('../utils/symbol');
const order = require('../order');
const transfer = require('../transfer');
const common = require('../common');
const expressionUtil = require('../expression/expression');
const account = require('../account');
const MethodsRunner = require('../expression/methodsRunner');
const clientIdentifier = require('../clientIdentifier');
const Decimal = require('decimal.js');
const debug = require('debug')('analog:lib:transferStrategys:baseStrategyRunner');

const mongoose = require('mongoose');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');
const StrategyPlanLog = mongoose.model('StrategyPlanLog'); 

class BaseStrategyRunner {
    constructor(){
    }

    static getInstance(type){
        let Strategy;

        switch(type.toLowerCase()){
        case 'between':
            Strategy = require('./betweenStrategyRunner');
            break;
        case 'normal':
            Strategy = require('./normalStrategyRunner');
            break;
        default:
            throw new Error(`类型为${type}的策略没有实现`);
        }

        return new Strategy();
    }


    /**
     * 执行操作策略
     * 
     * @param {TransferStrategy} strategy，交易策略
     * @param {Object} options 
     * @param {Object} [options.strategyPlanLog] 执行策略的计划Log。如果为空，则表示直接执行单独的交易策略，否则就是执行计划中的策略
     * @param {Object} [options.depths] 市场币种价格。为空时，会自动获取当前市场的币种价格
     * @param {Object} [optons.accounts] 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     * @param {Object} [options.env] 环境变量. e.g. { userName: "lcm" }
     * @returns { isSuccess: false, order：order, message:""}
     * @public
     */
    async runStrategy(strategy,options){
        let res = { isSuccess: true },condition;
        //let transferStrategyLog = await this.getStrategyOrders(strategy);
        let env = { userName: strategy.userName };

        options = options || {};
        options.env = options.env || env;
 
        if(strategy.conditions){
            condition =  strategy.conditions.join(' && ');
        }
        let conditionResult = await this.getConditionResult(condition,options);
        let conditionOrders = conditionResult.orders;
        if(!conditionOrders || conditionOrders.length == 0){
            return { isSuccess: true,message: conditionResult.message || "成功运行，策略没有满足交易条件"}
        }

        let getLogRes = await this.getTransferStrategyLog(conditionOrders,strategy,false,options.strategyPlanLog);
        if(!getLogRes.isSuccess){
            return { isSuccess: false,message: getLogRes.message, errorCode: getLogRes.errorCode };
        }

        let transferStrategyLog = getLogRes.log;
        transferStrategyLog.transferStrategy = strategy;
        if(transferStrategyLog.operates.length == 0){
            await transferStrategyLog.save();
            return { isSuccess: true };
        }

        transferStrategyLog.operates.sort(function(a,b){
            return +a.orgOperate.id > + b.orgOperate.id;
        });
        let operateLog = transferStrategyLog.operates[0];
        if(!operateLog.orgOperate.previousOperate || (operateLog.orgOperate.previousOperate <= 0)) { //如果是执行第一步
            if(operateLog.totalAmount != 0){
                let identifier = await clientIdentifier.getUserClient(strategy.userName,operateLog.orgOperate.site);
                if(!identifier){
                    return { 
                        isSuccess: false, 
                        message: `找不到ClientIdentifier。userName:${strategy.userName},site:${operateLog.orgOperate.site}`,
                        errorCode: "100003"
                    };
                } 

                if(options.strategyPlanLog){
                    let planOptions = {
                        strategyId: strategy._id,
                        consignAmountChange: Math.abs(operateLog.totalAmount),
                        log: {
                            source: '_1',
                            strategyId: strategy._id,
                            consignAmountChange: Math.abs(operateLog.totalAmount),
                            newOrder: null,
                            oldOrder: null, 
                            desc: `在执行策略步骤前时发生`
                        }
                    }
                    await BaseStrategyRunner.updateStrategyPlanAmount(options.strategyPlanLog,planOptions);
                    debug('updateStrategyPlanAmount_1');
                }

                operateLog.transferStrategyLog = transferStrategyLog;
                res = await this.runOperate(operateLog,{
                    identifier: identifier,
                    stepAmount: operateLog.totalAmount,
                    depths: options.depths
                });
                if(!res.isSuccess){
                    //这里应当进行失败时弥补 //todo 很重要
                    transferStrategyLog.status = 'failed';
                    transferStrategyLog.modified = new Date();
                    transferStrategyLog.errorMessage = res.message;

                    operateLog.status = 'failed';
                    operateLog.errorMessage = res.message;

                    if(options.strategyPlanLog){
                        let planOptions = {
                            strategyId: strategy._id,
                            consignAmountChange: -Math.abs(operateLog.totalAmount),
                            log: {
                                source: '_2',
                                strategyId: strategy._id,
                                consignAmountChange: -Math.abs(operateLog.totalAmount),
                                newOrder: null,
                                oldOrder: null, 
                                desc: `在执行策略步骤失败后发生`
                            }
                        }
                        await BaseStrategyRunner.updateStrategyPlanAmount(options.strategyPlanLog,planOptions);
                        debug('updateStrategyPlanAmount_2');
                    }
                } else {
                    operateLog.consignAmount = operateLog.totalAmount;
                    operateLog.status = '';
                    operateLog.actionIds.push(res.actionId);
                }
            }
        }
        
        await transferStrategyLog.save();
        return res;
    }

    /**
     * 获取符合条件表达式的交易数量以及价格等信息
     * 
     * @param {string} condition,条件表达式 
     * @param {Object} envOptions 
     * @param {Object} envOptions.depths: 市场币种价格。为空时，会自动获取当前市场的币种价格
     * @param {Object} envOptions.accounts: 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     *     env,环境变量. e.g. { userName: "lcm" }
     * @returns 返回满足条件的委托信息. 数据格式为，{ fixed: fixed,orders: conditionOrders,variableValues: variableValues, indexs: indexs, amounts: amounts } 
     *   如：{ fixed: true,orders: [{ symbol: "btc#cny",site: "btctrade", operateType: "buy",amount: 109,price: 6789 }]}
     */
    async getConditionResult(condition,options) {
        throw new Error('调用了没有实现的方法');
    }
 
    /**
     * 执行操作
     * 
     * @param {operateLog} operateLog
     * @param options 
     * @param {Object} options.identifier
     * @param {Number} options.stepAmount 每次执行订单的数量
     * @param {Array} options.depths 市场深度
     * @returns {[Order]} 
     * @public
     */
    async runOperate(operateLog, options){
        let res;
        let operate = operateLog.orgOperate;

        if(operate.action == "trade"){
            let newOptions = {
                identifier: options.identifier,
                stepAmount: options.stepAmount,
                depths: options.depths
            };
            res = await order.runOrderOperate(operateLog,newOptions)
        } else if(operate.action == "transfer"){
            let newOptions = {
                identifier: identifier,
                stepAmount: stepAmount,
                depths: options.depths
            };
            res = await transfer.runTransferOperate(operateLog,newOptions);
        } else {
            res = { isSuccess:false, message: `不能识别的操作:${operate.action}`,errorCode: '200000' }
        }
  
        return res;
    }


    /**
     * 获取条件表达式中的变量的详情
     * @param {String} variable, 条件表达式中的变量 如 huobi.btc#cny.buy
     * 
     * @returns 变量的详情，如 { site: "huobi",symbol: "btc#cny", variable: "buy",operateType:"buy" },表示huobi网站中btc#cny的价格,
     *    variable暂时支持 buy（买入价）、sell（卖出价）
     */
    _getVariableObject(variableItem){
        var items = variableItem.split('.');
        if(items.length != 2 && items.length != 3){
            return;
        }

        let variableName = items.length == 2 ? 'buy' : items[2];
        if(variableName){
            return {
                site: items[0],
                symbol: symbolUtil.getFullSymbol(items[1],items[0]).fullSymbol,
                variable: variableName.toLowerCase(),
                operateType: variableName
            };
        }
    }

    async getTransferStrategyLog(conditionOrders,strategy, checkAccount = false,strategyPlanLog = null) { 
        let accounts = await account.getUserAccounts(strategy.userName);
        let transferStrategyLog = new TransferStrategyLog({
            isTest: strategy.isTest,
            strategyId: strategy._id,
            userName: strategy.userName,
            status: 'wait', //wait,sucess,failed
            reason: '', //failed reason
            currentStep: 1,
            operates: [],
            //errorMessage: '',
            startTime: Date.now(),
            //endTime: Date,
            modified: Date.now()
        });

        if(strategyPlanLog){
            transferStrategyLog.strategyPlanLogId = strategyPlanLog._id;
        }

        for(var i = 0; i < strategy.operates.length; i++){
            let operate = strategy.operates[i];
            let isFirstOperate = !operate.previousOperate || operate.previousOperate <= 0;
            let accountItem;
            if(checkAccount){
                accountItem = accounts.find(function(item){
                    return item.site == operate.site && item.userName == strategy.userName;
                });
                if(!accountItem){
                    return { isSuccess: false, message: "找不到账户，有可能还没同步",errorCode: "100002" };
                }
            }

            var conditionOrder = conditionOrders.find(function(item){
                let operateType = operate.side; 
                if(operate.orderAmount < 0){
                    operateType = (operateType == 'buy' ? 'sell' : 'buy');
                }
                return item.site == operate.site && item.symbol == operate.symbol && item.operateType == operateType;
            }) 
            if(!conditionOrder){
                return { isSuccess: false, message: "运行错误，策略中的需要委托交易或转币的币种只能为条件表达式出现的币种",errorCode: "200000" };
            }
            
            let env = { userName: strategy.userName };
            let envOptions = { env: env };

            //确定每一步执行的数量
            let amount = strategyPlanLog ? strategyPlanLog.stepAmount : strategy.stepAmount; 
            if(!amount || amount == 0){
                return { isSuccess: false, message: "运行错误，每步执行数量设置错误",errorCode: "200000" };
            }
            amount = Math.abs(amount);
            
            // //计算实际还需要的执行量
            // let realAmount = amount;
            // if(strategyPlanLog){
            //     realAmount = strategyPlanLog
            // }
            // amount = Math.min(amount,realAmount);

            //确定做多还是做空
            if(operate.orderAmount < 0){
                amount = -amount;
            }
            if(!isFirstOperate){ //如果不是第一步，则根据倍数来计算。可以这么理解，第一步执行1个btc，如果第二步orderAmount=2，那么第二部执行2个btc
                amount = Math.abs(operate.orderAmount) * amount;
            } 

            //开始执行
            if(operate.action == 'transfer'){ //操作类型。分为 trade(成交)、transfer（转币）两种
                //成交金额
                amount = TransferStrategyLog.generateCoinDibsAmount(amount,operate.symbol);
                if(amount <= 0 || amount < operate.minStepAmount) {
                    return { isSuccess: false, message: `账户余额不足` };
                }
                amount = common.fixCoinAmount(amount,operate.symbol);

                //是否自动执行
                var sysAuto = operate.auto && apiConfigUtil.isAutoTransfer(operate.symbol);
                let totalAmount = (operate.id == 1 ? totalAmount : 0);
                totalAmount = common.fixCoinAmount(totalAmount); 

                let logTransferOperate = {
                    orgOperate: operate,
                    actionIds: [],
                    //委托 -> 等待 -> 成交 -> 分批或不分批执行下一步
                    //几种金额的关系 totalAmount >= consignAmount >= actualAmount >= undeal
                    totalAmount: totalAmount, //需要执行的总金额 
                    undeal: 0, //这一步已经执行完成,但是下一步未处理的金额 
                    consignAmount: 0, //委托金额
                    actualAmount: 0, //实际转币或成交金额
                    //price: Number, //委托价格。当action=trade时有效
                    status: 'wait', //wait,success,failed,hand(等待人工处理),assign(已委托)
                    auto: sysAuto

                };
                transferStrategyLog.operates.push(logTransferOperate);

            } else if(operate.action == 'trade') {
                let arr = operate.symbol.split('#');
                
                let sellCoinLeft,buyCoinLeft,
                    coin = arr[0];
                if(checkAccount){
                    let operateType = operate.side; 
                    if(operate.orderAmount < 0){
                        operateType = (operateType == 'buy' ? 'sell' : 'buy');
                    }
                    if(operateType == "sell"){ //卖出时不需要考虑资金是否充足,但不能超账户剩余数量
                        sellCoinLeft = accountItem.getAvailable(arr[0]);
                        amount = Math.min(sellCoinLeft,amount);
                    } else { //buy
                        buyCoinLeft = accountItem.getAvailable(arr[1]);
                        let canBuyAmount = new Decimal(buyCoinLeft).div(conditionOrder.price).toNumber();
                        amount = Math.min(canBuyAmount,amount);
                    }
                }

                //检验第一步操作可委托的数量是否满足最小量要求
                let totalAmount = (isFirstOperate ? amount : 0);
                totalAmount = common.fixCoinAmount(totalAmount);  //保留4位小数
                if(isFirstOperate && (Math.abs(operate.minStepAmount) > Math.abs(totalAmount))){
                    res.isSuccess = false;
                    res.message = `在id为${operate.id}操作上，最多委托数量为${amount},但要求每单的最小量为${operate.minStepAmount}`;
                    return res;
                }

                //添加每一步日志
                let consignPrice = common.fixPrice(conditionOrder.price); //保留2位小数 
                let logTransferOperate = {
                    orgOperate: operate,
                    actionIds: [],
                    totalAmount: totalAmount, //需要执行的总金额 
                    undeal: 0, //这一步已经执行完成,但是下一步未处理的金额 
                    consignAmount: 0, //委托金额
                    actualAmount: 0, //实际转币或成交金额
                    price: consignPrice, //委托价格。当action=trade时有效
                    status: 'wait', //wait,success,failed,hand(等待人工处理),assign(已委托)
                    auto: operate.auto
                };
                transferStrategyLog.operates.push(logTransferOperate);
            }
        }

        transferStrategyLog = await transferStrategyLog.save();
        return { isSuccess: true, log: transferStrategyLog };
    }

    async getOperateAmount_obsolate(amountExpression,conditionOrders,envOptions){
        let stack = expressionUtil.getConditionStacks(amountExpression);
        let stackNew = [];

        let getVarValueMethod = async function(stackItem){
            return await this.getStackItemValue(stackItem,conditionOrders,envOptions);
        }

        //将表达式的变量用值替换掉,形成一个新的堆栈
        for(let j = 0; j < stack.length; j++){
            let stackItem = stack[j];
            let expressionType = expressionUtil.getExpressionItemType(stackItem);

            //getStackItemValue 返回的值:
            //{ value: 8, type: 'method' } //value:处理后返回的值 type:表达式类型
            let stackItemValue = await this.getStackItemValue(stackItem,conditionOrders,envOptions); // 
            if(stackItemValue.type == 'method'){
                let options = {
                    getVarValueMethod: getVarValueMethod
                };

                let methodsRunner = new MethodsRunner(options);
                let val = await methodsRunner.calculate(stackItem);
                stackNew.push(val);
            } else {
                stackNew.push(stackItemValue.value);
            }
        }

        //新的可以执行的表达式
        let expressNew = stackNew.join('');

        //计算表达式的值，只要返回false,则终止运行,否则推进数组indexs
        let res,amount;
        try{
            res = eval(expressNew);
            amount = parseFloat(res);
            if(isNaN(amount) || !isFinite(amount)){
                amount = 0;
            }
        } catch(e) {
            amount = 0;
        }

        return amount;
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
    static async updateStrategyPlanAmount(strategyPlanLog,options){
        if(!options.strategyId){
            throw new Error(`参数options.strategyId不能为空`);
        }

        let updateOptions = {
            $inc: {
                'strategys.$.actualAmount': options.actualAmountChange || 0,
                'strategys.$.consignAmount': options.consignAmountChange || 0 
            }
        }

        if(!options.log){
            options.log = {
                source: 'unknown',
                consignAmountChange: options.consignAmountChange || 0,
                actualAmountChange: options.actualAmountChange || 0
            }
        }

        if((options.actualAmountChange || 0) != 0){
            updateOptions.$push = {
                'actualAmountLogs': options.log,
            }
        }

        if((options.consignAmountChange || 0) != 0){
            updateOptions.$push = {
                'consignAmountLogs': options.log
            }
        }

        strategyPlanLog = await StrategyPlanLog.findOneAndUpdate({ 
            _id: strategyPlanLog._id,
            'strategys.strategyId': options.strategyId,
        }, updateOptions ,{ 
            upsert: false,
            new: true
        }).exec();

        debug(`consignAmountChange:${options.consignAmountChange || 0}  actualAmountChange: ${options.actualAmountChange || 0}`);
    }

    /**
     * 获取堆栈项的值
     * 
     * @param {String} stackItem,堆栈项
     * @param {Array} conditionDepths,各个网站某档的即时价格. 如:
     *   [{ site: "huobi", symbol: 34,price: 324,amount: 34 },{ site: "btctrade", symbol: 34,price: 324,amount: 34 }]
     * @param {Object} envOptions 
     *    depths: 市场币种价格。为空时，会自动获取当前市场的币种价格
     *    accounts: 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     *    env,环境变量. e.g. { userName: "lcm" }
     * @returns {Obejct} 处理后的值. 如: { value: 8, type: 'method' } //value:处理后返回的值 type:表达式类型
     *     
     */
    async getStackItemValue(stackItem,conditionDepths,envOptions){ 
        var item = {}, //处理后的值
            itemValue,
            expressionType;
            
        expressionType = expressionUtil.getExpressionItemType(stackItem);
        itemValue = stackItem;
        item.type = expressionType;

        if(expressionType == 'variable'){
            //如果是牵涉到委托价格的(如huobi.btc.buy),获取表达式的含义,返回数据如下:
            //如:{ site: "huobi",symbol: "btc#cny", variable: "buy",operateType:"buy" }
            let assignPriceInfo = this._getAssignPriceInfo(stackItem);

            if(assignPriceInfo){  //如果表达式表示的是符合条件的委托价格 如 huobi.btc.buy或huobi.btc.sell
                let realPrice = conditionDepths.find(function(value){
                    return value.symbol == assignPriceInfo.symbol 
                            && value.site == assignPriceInfo.site
                            && value.operateType == assignPriceInfo.operateType;
                });

                if(realPrice){
                    if(assignPriceInfo.fieldName == 'price'){
                        itemValue = realPrice.price;
                    } else if(assignPriceInfo.fieldName == 'amount'){
                        itemValue = realPrice.amount;
                    }
                }
            } else { //不是则通过这里获取值
                let variableValue = await expressionUtil.getVariableValue(stackItem,envOptions);
                itemValue = variableValue;
            }

        } else if(expressionType == 'value'){
            itemValue = stackItem;
            if(stackItem.indexOf('%') != -1){
                itemValue = stackItem.replace('%','');
                itemValue = parseFloat(itemValue) / 100;
            } else {
                itemValue = parseFloat(itemValue);
            }
            
        } else if( expressionType == 'method'){
            itemValue = stackItem;
        } else { //operator 
            itemValue = stackItem;
        }

        item.value = itemValue;
        return item;
    } 

    
    /**
     * 获取[buy/sell]条件表达式中的变量的详情
     * @param {String} variable, 条件表达式中的变量 如 huobi.btc#cny.buy
     * 
     * @returns 变量的详情，如 
         { site: "huobi",symbol: "btc#cny", variable: "buy",operateType:"buy" },表示huobi网站中btc#cny的价格,
     *    variable暂时支持 buy（买入价）、sell（卖出价）
     */
    _getAssignPriceInfo(variableItem){
        var items = variableItem.split('.');
        if(items.length < 2){
            return;
        }
        
        let variableName = items[2].toString().toLowerCase();
        if(variableName != 'buy' && variableName != 'sell'){ //只能为buy或sell
            return;
        }

        var fieldName = 'price';
        if(items.length >= 4){
            fieldName = items[3].toString().toLowerCase();
        }

        if(!variableName || 
           (fieldName != 'price' && fieldName != 'amount')){ //只能为price或amount
            return;
        }

        let site = items[0];
        let symbol =  symbolUtil.getFullSymbol(items[1],site).fullSymbol;

        return {
            site: site,
            symbol: symbol,
            variable: variableName.toLowerCase(),
            operateType: variableName,
            fieldName: fieldName
        };
    }
    
    getPercentAmount(amount){
        if(!amount){
            return 0;
        }

        var isPercent = (amount.indexOf('%') != -1);
        if(isPercent){
            amount = amount.replace('%','');
        }

        var float = parseFloat(amount);
        if(isNaN(float) || !isFinite(float)){
            float = 0;
        }

        return {
            isPercent: isPercent,
            amount: float
        }
    }

}

module.exports = BaseStrategyRunner;