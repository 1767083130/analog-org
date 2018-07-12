'use strict';

const realTimePrice = require('../realTimePrice');
const expressionUtil = require('../expression/expression');
const MethodsRunner = require('../expression/methodsRunner');
const BaseStrategyRunner =  require('./BaseStrategyRunner');
const Decimal = require('decimal.js');
const orderPriceUtil = require('./orderPriceUtil');

/**
 * 
 */
class NormalStrategyRunner extends BaseStrategyRunner {
    constructor(){
        super(); 
    }

    /**
     * 获取符合条件表达式的交易数量以及价格等信息
     * 
     * @param {string} condition,条件表达式 
     * @param {Object} [envOptions] 
     * @param {Object} [envOptions.depths] 市场币种价格。为空时，会自动获取当前市场的币种价格
     * @param {Object} [envOptions.accounts] 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     * @param {Object} [envOptions.env]  环境变量,如果变量中牵涉到账户数据时，必填. e.g. { userName: "lcm" }
     * @returns 返回满足条件的委托信息. 数据格式为，
          { fixed: fixed,orders: conditionOrders,variableValues: variableValues, indexs: indexs, amounts: amounts } 
        如：{ fixed: true,orders: [{ symbol: "btc#cny",site: "btctrade", operateType: "buy",amount: 109,price: 6789 }]
          }
     */
    async getConditionResult(condition,envOptions) { 
        envOptions = envOptions || {};
        var stack = expressionUtil.getConditionStacks(condition);
        var variableValues = await this._getVarDepths(stack,envOptions.depths); //表达式的变量
        if(!variableValues){
            return { isSuccess: false, fixed: false, message: "有可能获取交易品种的行情失败" }
        }

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
                conditionDepths = []; //

            //获取需要用到的即时价格信息
            for(let i = 0; i < len; i++){
                let index = indexs[i];
                let price = variableValues[i].values[index][0];
                let amount = variableValues[i].values[index][1];

                conditionDepths.push({
                    site: variableValues[i].site, 
                    symbol: variableValues[i].symbol,
                    price: price,
                    amount: amount,
                    operateType: variableValues[i].operateType
                });
            }
            
            var getVarValueMethod = async function(stackItem){ //todo 待确认
                return this.getStackItemValue(stackItem,conditionDepths,envOptions);
                //return await super.getStackItemValue(stackItem,conditionDepths,env);
            }.bind(this);

            //将表达式的变量用值替换掉,形成一个新的堆栈
            for(let j = 0; j < stack.length; j++){
                let stackItem = stack[j];

                //getStackItemValue 返回的值:
                //{ value: 8, type: 'method' } //value:处理后返回的值 type:表达式类型
                let stackItemValue =  await this.getStackItemValue(stackItem,conditionDepths,envOptions); // 
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
            isSuccess: true,
            fixed: fixed,
            amounts: amounts,
            orders: conditionOrders,
            indexs: indexs, 
            variableValues: variableValues 
        };
        //return conditionOrders;
    }

    /**
     * 计算表达式的值
     * 
     * @param {string} condition,条件表达式 
     * @param {Object} [envOptions] 
     * @param {Object} [envOptions.depths] 市场币种价格。为空时，会自动获取当前市场的币种价格
     * @param {Object} [envOptions.accounts] 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     * @param {Object} [envOptions.env]  环境变量,如果变量中牵涉到账户数据时，必填. e.g. { userName: "lcm" }
     * @returns 返回计算后的结果
     */
    async getExpressionValue(condition,envOptions) { 
        if(!condition){
            return;
        }
        envOptions = envOptions  || {};

        var stack = [];
        var fullStack = expressionUtil.getConditionStacks(condition);
        for(let i = 0;i < fullStack.length; i ++){
            if(!expressionUtil.isConditionOperate(fullStack[i])){
                stack.push(fullStack[i]);
            } else {
                break;
            }
        }
        
        var variableValues = await this._getVarDepths(stack,envOptions.depths); //表达式的变量
        if(!variableValues){
            return { isSuccess: false, fixed: false, message: "有可能获取交易品种的行情失败" }
        }

        let conditionDepths = [];
        for(let i = 0; i < variableValues.length; i++){
            conditionDepths.push({ 
                site: variableValues[i].site,
                symbol: variableValues[i].symbol,
                operateType: variableValues[i].operateType,
                price: variableValues[i].values[0][0],
                amount: variableValues[i].values[0][1]
            });
        }

        //将表达式的变量用值替换掉,形成一个新的堆栈
        let stackNew = [];
        for(let j = 0; j < stack.length; j++){
            let stackItem = stack[j];

            //getStackItemValue 返回的值:
            //{ value: 8, type: 'method' } //value:处理后返回的值 type:表达式类型
            let stackItemValue =  await super.getStackItemValue(stackItem,conditionDepths,envOptions); // 
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
        let expressNew = stackNew.join('');

        //计算表达式的值，只要返回false,则终止运行,否则推进数组indexs
        var res;
        try{
            res = eval(expressNew);
        } catch(e) {
        }

        return res;
    }
   

    async getStackItemValue(stackItem,conditionDepths,envOptions){
        return await super.getStackItemValue(stackItem,conditionDepths,envOptions);
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
                operateType: variableObj.operateType == 'buy' ? 'sell' : 'buy',
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
          site: "huobi",
          operateType: "buy",
          symbol: "btc#cny",
          values: [[4012,0.5],[4011,0.6]]
       }]
     */
    async _getVarDepths(stack,depths){
        let variables = [];

        for (var i = 0; i < stack.length; i++) {
            let stackItem = stack[i];
            let expressionType = expressionUtil.getExpressionItemType(stackItem);
            if(expressionType != 'variable'){
                continue;
            }

            let assignPriceInfo = this._getAssignPriceInfo(stackItem);
            if(assignPriceInfo){
                let newDepths;
                if(depths){
                    newDepths = depths.find(function(value){
                        return value.site == assignPriceInfo.site && value.symbol == assignPriceInfo.symbol;
                    });
                }

                if(!newDepths){
                    let getDepthsRes = realTimePrice.getSymbolDepths(assignPriceInfo.site,assignPriceInfo.symbol);
                    if(!getDepthsRes.isSuccess){
                        return;
                    }
                    newDepths = getDepthsRes.data;
                }

                if(!newDepths){
                    return;
                }

                let existsVariable = variables.find(function(value){
                    return value.stackItem == stackItem;
                });

                if(!existsVariable){
                    variables.push({ 
                        stackItem: stackItem, 
                        site: assignPriceInfo.site,
                        symbol: assignPriceInfo.symbol,
                        operateType: assignPriceInfo.operateType,
                        values: (assignPriceInfo.operateType == 'buy' ? newDepths.bids : newDepths.asks)
                    });
                }
            }
        }

        return variables;
    }

    /**
     * 运行策略时必须获取到的数据类型
     * @param {Object} strategy 需要运行的策略
     * @public
     */
    async getNecessaryDataType(strategy){
        if(strategy.conditions.length == 0){
            return [];
        }

        let condition = strategy.conditions[0];
        let fullStack = expressionUtil.getConditionStacks(condition);
        let stack = [];
        for(let i = 0;i < fullStack.length; i ++){
            if(!expressionUtil.isConditionOperate(fullStack[i])){
                stack.push(fullStack[i]);
            } else {
                break;
            }
        }

        let datas = [];
        for (var i = 0; i < stack.length; i++) {
            let stackItem = stack[i];
            let expressionType = expressionUtil.getExpressionItemType(stackItem);
            if(expressionType != 'variable'){
                continue;
            }

            let assignPriceInfo = this._getAssignPriceInfo(stackItem);
            if(assignPriceInfo){
                datas.push({
                    site: assignPriceInfo.site,
                    symbol: assignPriceInfo.symbol,
                });
            }
        }

        return datas;
    }
}

module.exports = NormalStrategyRunner;