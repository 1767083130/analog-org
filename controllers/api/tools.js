'use strict';

const only = require('only');
const Decimal = require('decimal.js');
const operate = require('../../lib/expression/operate');
const expression = require('../../lib/expression/expression');
const trialMarket = require('../../lib/transferStrategys/trialMarket');

module.exports = function (router) {
  
    /**
     * 获取所有策略条件表达式公用的变量值(有些变量值是与特定表达式相关的.如 huobi.eth#btc.buy,这里不能获取到)
     * e.g variable: chbtc.btc#cny.bids[0]
     */
    router.get('/getVariableValue',  async function (req, res) {
        try{
            let variable = req.query.variable,
                envOptions = {
                    userName: req.user && req.user.userName
                };
            variable = variable.trim().toLowerCase();

            let val = await expression.calculate(variable,envOptions);
            let getRes = {
                isSuccess: true,
                value: val
            };
            res.json(getRes);
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "服务器端发生错误"});
        }
    });


    /**
     * 执行操作
     * e.g expression: buy({"site": "chbtc","symbol": "btc#cny", "userName": "lcm","price": 1,"amount": 0.01 })
     */
    router.post('/operate',  async function(req, res) {  
        try{
            let expression = req.body.expression;
            let envOptions = {
                userName: req.user.userName
            }
            
            let runRes = await operate.runOperates(expression,envOptions,true);
            res.json(runRes);
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
}