'use strict';

const mongoose = require('mongoose');
const co = require('co');
const customConfig = require('../../../config/customConfig');
const database = require('../../../lib/database');

/**
 * 运行方式： node test/lib/transferStrategys/strategyTester
 */


let dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

let db = mongoose.connection;
db.once('open',function callback(){
    /**
     * 检验strategy生成的订单是否正确
     */
    setInterval(runNormalStrategry, 1000);
});

const transferController = require('../../../lib/transferStrategys/transferController');
async function runNormalStrategry(){
    let userName = 'lcm'
    let env = { userName: userName };
    let envOptions = { env: env };
    let strategyType = 'normal';
    let condition = '(chbtc.etc#cny.buy / chbtc.btc#cny.sell - bitfinex.etc#btc.sell ) / bitfinex.etc#btc.sell * 100 > 0.3';

    let runRes = await transferController.getConditionResult(condition,strategyType,envOptions);
    checkStrategryOrdersValid(condition,runRes);
}

function checkStrategryOrdersValid(expression,strategyOrders){
    let runExpression = function(express){
        var res;
        try{
            res = eval(express);
        } catch(e) {
            res = false;
            console.error(`判断表达式的值时发生错误。 ${express}`);
        }
        return res;
    }

    let newExpression = expression;
    for(let variableItem of strategyOrders.variableValues){
        newExpression = newExpression.replace(new RegExp(variableItem.stackItem,"gm"),variableItem.values[0][0]);
    }
    
    let res = runExpression(newExpression);
    if(res != strategyOrders.fixed){
        console.error('系统错误，1');
        return;
    }

    newExpression = expression;
    if(strategyOrders.fixed){
        let i = 0;
        for(let variableItem of strategyOrders.variableValues){
            newExpression = newExpression.replace(variableItem.stackItem,variableItem.values[strategyOrders.indexs[i][0]]);
        }
        res = runExpression(newExpression);
        if(res != strategyOrders.fixed){
            console.error('系统错误，2');
            return;
        }
    }

    console.error('系统正常');
}
