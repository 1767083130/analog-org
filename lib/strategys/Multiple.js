﻿'use strict';

const mongoose = require('mongoose');
const realTimePrice = require('../realTimePrice');
const order = require('../order');
const account = require('../account');
const Decimal = require('decimal.js');
const symbolUtil =  require('../utils/symbol');
const MethodsRunner = require('../expression/methodsRunner');

/**
 * 
 */
class Multiple {
    constructor(){
    }

    /**
     * 运行策略
     */
    async runStrategy(strategy,stepCallBack){
        let siteItems = [{ site:"chbtc", symbols: ["btc","eth"] }]; //网站
        let strategySymbols = ["btc","eth","etc","ltc"];
        let longPositions = [{ coin: "btc",amount: 10,site: "chbtc" },{ coin: "eth",amount: 10,site: "chbtc" }];
        let positions = [{ site:"chbtc",symbol: "btc#cny", amount: 10 }];
        let accounts = [{ site: "chbtc", coin: "btc", amount: 100 },{ site: "chbtc", coin: "cny", amount: 100 }];
        let marginSites = ["bitfinex"]; //支持保证金双向交易的网站
        let leverage = 3; //最大支持的杠杆倍数

        let buySites = [],  //e.g [{ site: "chbtc",symbol: "btc#cny",asks: [[7800,8.9],[7798.6,12.5]],total: 100, available: 120 }]
            sellSites = []; //e.g [{ site: "chbtc",symbol: "btc#cny",bids: [[7800,8.9],[7798.6,12.5]],total: 100, available: 120  }]
        for(var i = 0; i < siteItems.length; i++){
            let siteItem = siteItems[i];

            for(var j = 0; j < siteItem.symbols.length; j++){
                let symbolItem = siteItem.symbols[j],
                    symbolInfo = symbolUtil.getFullSymbol(symbolItem.symbol,siteItem.site); 
                // { fullSymbol:"btc#cny_1w", contractType: "futures",isValid: true,message: "成功" }

                //如果没有配置为在此策略中运作的品种，则直接忽略 
                if(!strategySymbols.indexOf(symbolItem.symbol)){
                    continue;
                }

                //获取行情信息
                let realPrice = await realTimePrice.getRealPrice(siteItem.site,symbolItem.symbol);
                if(!realPrice){
                    continue;
                }

                //支持双向操作的品种： 
                //（1）期货品种（都包含了“_”,如 bitmex.btc_1w）；（2）能使用保证金交易网站的所有交易品种（如bitfinex）
                if(symbolInfo.contractType == 'spot'){ //现货
                    buySites.push(symbolInfo.fullSymbol);
                    if(marginSites.indexOf(symbolInfo.fullSymbol) != -1){
                        sellSites.push({ site: siteItem.site,symbol: symbolInfo.fullSymbol });
                    }
                } else { //期货
                    buySites.push({ site: siteItem.site,symbol: symbolInfo.fullSymbol });
                    sellSites.push({ site: siteItem.site,symbol: symbolInfo.fullSymbol });
                }
            }
        }
    }


    /**
     * 回测
     */
    async backTestStrategy(strategy){
       throw new Error('调用了尚未实现的方法');
       //return false;
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
    }

    async onOrderDelayed(e){
        if(e.order.reason != 'stoploss'){
            return;
        }
    }


    /**
     * 获取符合条件表达式的交易数量以及价格等信息
     * 
     * @param {string} condition,条件表达式 
     * @param {Object} envOptions 
     *    realPrices: 市场币种价格。为空时，会自动获取当前市场的币种价格
     *    accounts: 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     *    env,环境变量. e.g. { userName: "lcm" }
     * @returns 返回满足条件的委托信息. 数据格式为，
          { fixed: fixed,orders: conditionOrders,variableValues: variableValues, indexs: indexs, amounts: amounts } 
        如：{ fixed: true,orders: [{ symbol: "btc#cny",site: "btctrade", operateType: "buy",amount: 109,price: 6789 }]
          }
     */
    async getConditionResult(condition,envOptions) { 
        var stack = expression.getConditionStacks(condition);

        var variableValues = await this._getVarRealPrices(stack,envOptions.realPrices); //表达式的变量
        var indexs = [], //行情价格中的索引
            amounts = [], //能符合条件的委托价格
            len = variableValues.length;

        for(var i = 0; i < len; i++){
            indexs[i] = 0;
            //amounts[i] = variableValues[i].values[0][1]; //[1]
        }

        var isAllEnd = function(){
            for(var i = 0; i < len; i++){
                var isEnd = (indexs[i] == variableValues[i].values.length);
                if(!isEnd){
                    return false;
                }
            }

            return true;
        }
        
        //获取符合条件的委托数量最小的一方.
        var getMinAmountItem = function() {
            if(amounts.length == 0){
                return -1;
            }

            var min = Math.max.apply(null,amounts), //amounts[0],
                minIndex = -1;
            for(let i = 0; i < amounts.length; i++){
                if (min >= amounts[i] &&  //取较小者
                    indexs[i] < variableValues[i].values.length - 1) { //数组索引不能超界限
                    min = amounts[i];
                    minIndex = i;
                }
            }

            return minIndex;
        }

        var lastIndex = 0, //上一次推进的数组项
            isFirst = true, //是否为第一次运行，需要保证判断条件语句运行一次
            fixed = false;  //是否符合运行条件
        while (isFirst || !isAllEnd()) {
            var expressNew,
                minItem = 0;

            var stackNew = [],
                conditionRealPrices = []; //

            //获取需要用到的即时价格信息
            for(let i = 0; i < len; i++){
                let index = indexs[i];
                let price = variableValues[i].values[index][0];
                let amount = variableValues[i].values[index][1];

                conditionRealPrices.push({
                    site: variableValues[i].site, 
                    symbol: variableValues[i].symbol,
                    price: price,
                    amount: amount,
                    operateType: variableValues[i].operateType
                });
            }
            
            var getVarValueMethod = async function(stackItem){ //todo 待确认
                return this.getStackItemValue(stackItem,conditionRealPrices,envOptions);
                //return await super.getStackItemValue(stackItem,conditionRealPrices,env);
            }.bind(this);

            //将表达式的变量用值替换掉,形成一个新的堆栈
            for(let j = 0; j < stack.length; j++){
                let stackItem = stack[j];

                //getStackItemValue 返回的值:
                //{ value: 8, type: 'method' } //value:处理后返回的值 type:表达式类型
                let stackItemValue =  await this.getStackItemValue(stackItem,conditionRealPrices,envOptions); // 
                if(stackItemValue.type == 'method'){
                    let options = {
                        getVarValueMethod: getVarValueMethod
                        //env: envOptions.env
                    };

                    let methodsRunner = new MethodsRunner(options);
                    let val = await methodsRunner.calculate(stackItem);
                    stackNew.push(val);
                } else {
                    stackNew.push(stackItemValue.value);
                }
            }

            //新的可以执行的表达式
            expressNew = stackNew.join('');

            //计算表达式的值，只要返回false,则终止运行,否则推进数组indexs
            var res;
            try{
                res = eval(expressNew);
            } catch(e) {
                res = false;
            }

            if(res){
                fixed = true;
            }

            if(variableValues.length > 0){
                if (res) {
                    if (isFirst) {
                        for (let m = 0; m < len; m++) {
                            amounts[m] = variableValues[m].values[0][1]; //[1]
                        }
                    }

                    if (indexs[lastIndex] > 0) {
                        var level = indexs[lastIndex];
                        amounts[lastIndex] = new Decimal(amounts[lastIndex]).plus(variableValues[lastIndex].values[level][1]).toNumber();
                        //amounts[lastIndex] += variableValues[lastIndex].values[level][1];
                    }

                    //推进数组indexs
                    minItem = getMinAmountItem();
                    lastIndex = minItem;
                
                    if (minItem != -1) {
                        indexs[minItem]++;
                    } else {
                        //amounts[lastIndex] += variableValues[lastIndex].values[level][1];
                        break;
                    }
                } else {
                    if (isFirst) {
                        for (let m = 0; m < len; m++) {
                            amounts[m] = 0;
                        }
                    } else {
                        indexs[lastIndex]--;
                    }

                    break;
                } //if (res) {
            } //if(variableValues.length > 0){

            isFirst = false;
        } //while
        
        var conditionOrders = this._getConditionOrders(variableValues, indexs, amounts);
        return {
            fixed: fixed,
            orders: conditionOrders,
            variableValues: variableValues, 
            indexs: indexs, 
            amounts: amounts
        };
        //return conditionOrders;
    }

    async getStackItemValue(stackItem,conditionRealPrices,envOptions){
        return await super.getStackItemValue(stackItem,conditionRealPrices,envOptions);
    }

    /**
     * 获取满足条件的交易
     * 
     * @param variableValues 市场信息参数
     * @param indexs 市场信息参数数组对应的索引
     * @param amounts 
     * 
     * @returns 满足条件的交易数组 如：
       [{ symbol: "btc#cny",
          site: "btctrade",
          operateType: "buy",
          amount: 109,
          price: 6789 }]
     * 
     */
    _getConditionOrders(variableValues, indexs, amounts) {
        var orders = [];
        for (var i = 0; i < variableValues.length; i++) {
            var index = indexs[i];
            var amount = amounts[i];
            if (amount == 0) {
                return [];
            }

            var variableValue = variableValues[i]; //{ stackItem: stackItem, values: res.values }
            var variableObj = this._getVariableObject(variableValue.stackItem);
            var price = variableValue.values[index][0]; //[0]为价格，[1]为数量

            orders.push({
                symbol: variableObj.symbol,
                site: variableObj.site,
                operateType: variableObj.operateType,
                amount: amount,
                price: price
            });
        }

        return orders;
    }

    /**
     * 获取计算条件表达式需要的即时价格信息
     *
     * @param {Array} stack,条件表达式的堆栈
     * @returns {Array} 即时价格信息 如:
       [{ 
          stackItem: 'huobi.btc.buy', 
          values: [[4012,0.5],[4011,0.6]]
       }]
     */
    async _getVarRealPrices(stack,realPrices){
        let variables = [];

        for (var i = 0; i < stack.length; i++) {
            let stackItem = stack[i];
            let expressionType = expression.getExpressionItemType(stackItem);
            if(expressionType != 'variable'){
                continue;
            }

            let assignPriceInfo = this._getAssignPriceInfo(stackItem);
            if(assignPriceInfo){
                let realPrice;
                if(realPrices){
                    realPrice = realPrices.find(function(value){
                        return value.site == assignPriceInfo.site && value.symbol == assignPriceInfo.symbol;
                    });
                }

                if(!realPrice){
                    realPrice = await realTimePrice.getRealPrice(assignPriceInfo.site,assignPriceInfo.symbol);
                }

                if(!realPrice){
                    return;
                }

                let existsVariable = variables.find(function(value){
                    return value.stackItem == stackItem;
                });

                var operateType = assignPriceInfo.operateType;
                if(!existsVariable){
                    variables.push({ 
                        stackItem: stackItem, 
                        values: (operateType == 'buy' ? realPrice.bids : realPrice.asks),
                        site: assignPriceInfo.site,
                        symbol: assignPriceInfo.symbol,
                        operateType: assignPriceInfo.operateType
                    });
                }
            }
        }

        return variables;
    }
}

module.exports = Multiple;