'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferStrategy = mongoose.model('TransferStrategy');
const Strategy = mongoose.model('Strategy');

const async = require('co').wrap;
const only = require('only');
const accountLib = require('../lib/account');
const expression = require('../lib/expression/expression');
const operate = require('../lib/expression/operate');
const realTimePrice = require('../lib/realTimePrice');
const Decimal = require('decimal.js');

module.exports = function (router) {
    //router.get('/', account.index_api);
  
    router.get('/depth.do',  async function(req, res) {
        let realPriceRes = { isSuccess: false };
        try{
            let site = req.query.site;
            let symbol = req.query.symbol;
            if(!site){
                return res.json(realPriceRes);
            }
            if(!symbol){
                return res.json(realPriceRes);
            }
            symbol = symbol.replace(':','#');

            let realPrice = await realTimePrice.getSymbolDepths(site,symbol);
            if(realPrice){
                realPriceRes = { isSuccess: true, depth: realPrice};
            } else {

            }
        } catch (err) {
            console.error(err);
            realPriceRes = { isSuccess: false, message: "500:服务器端发生错误"};
        }

        res.json(realPriceRes);
    });

    /**
     * 获取所有策略条件表达式公用的变量值(有些变量值是与特定表达式相关的.如 huobi.eth#btc.buy,这里不能获取到)
     * e.g variable: chbtc.btc#cny.bids[0]
     */
    router.get('/getVariableValue.do',  async function(req, res) {
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
    router.post('/operate.do',  async function(req, res) {  
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