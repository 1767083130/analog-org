'use strict';

const transferController = require('./transferStrategys/transferController.js');
const stopLoss = require('./strategys/stopLoss.js');

let strategy = new class{
    constructor(){
    }

    /**
     * 执行平台之间的差价操作策略
     * 
     * @param {strategy} strategy 交易策略
     * @param {Object} [options] 附带的参数
     * @param {StrategyPlan} [options.strategyPlan]  交易策略所属的策略
     * @param {Object} [options.env] 运行的环境变量。e.g { userName: strategyPlan.userName }
     * @returns { isSuccess: false, message:""}
     */
    async runStrategy(strategy,options){
        let res = await transferController.runStrategy(strategy,options);
        return res;
    }

    /**
     * 获取符合条件表达式的交易数量以及价格等信息
     * 
     * @param {string} condition 条件表达式 
     * @param {String} strategyType 策略类型
     * @param {Object} envOptions 
     * @param {Object} [envOptions.depths] 市场币种价格。为空时，会自动获取当前市场的币种价格
     * @param {Object} [envOptions.accounts] 账户信息。为空时会自动获取env.userName的账户信息。
     *              当变量是关于账户信息的，accounts、env两者不能全为空
     * @param {Object} [envOptions.env]  环境变量,如果变量中牵涉到账户数据时，accounts、env两者不能全为空. e.g. { userName: "lcm" }
     * @returns 返回满足条件的委托信息. 数据格式为，
          { fixed: fixed,orders: conditionOrders,variableValues: variableValues, indexs: indexs, amounts: amounts } 
        如：{ fixed: true,orders: [{ symbol: "btc#cny",site: "btctrade", operateType: "buy",amount: 109,price: 6789 }]
          }
     */
    async getConditionResult(condition,strategyType,envOptions){
        let res = await transferController.getConditionResult(condition,strategyType,envOptions);
        return res;
    }

    /**
     * 执行平台之间的差价操作策略
     * 
     * @param {strategy} strategy，交易策略
     * @returns { isSuccess: false, message:""}
     */
    async runAllTransferStrategys(){
        //todo 
    }


    async runStopLoss(stopLossLog,accountInfo,identifier){
        let res = await stopLoss.runStopLoss(stopLossLog,accountInfo,identifier);
        return res;
    }

    async runStopLosses(){
        await stopLoss.runStrategy(function(stepRes){
           console.log('执行完成一个'); //todo
        });
    }
}();

module.exports = strategy;

