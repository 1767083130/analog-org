'use strict';

const query = require('querystring');
const request = require('supertest');
const co = require('co');
const assert = require('assert');
const expression = require('../../../lib/expression/expression');
const mongoose = require('mongoose');

describe('表达式测试. path:  expression/expression.js', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('getConditionStacks 获取表达式堆栈',function(done){
        //todo getConditionStacks有个bug，多个字符的运算符不能识别，暂时避开 
        let stacks;
        stacks = expression.getConditionStacks('   a >= 0'); //前面3空格
        assert.equal(stacks.length,6);
        assert.equal(stacks[0].length,3);

        stacks = expression.getConditionStacks('7==7 && btctrade.btc.account.total0 >= 0');
        assert.equal(stacks.length,11);

        stacks = expression.getConditionStacks('1==1');
        assert.equal(stacks.length,3);

        stacks = expression.getConditionStacks('1!=1');
        assert.equal(stacks.length,3);
        done();
    });

    it('getVariableValue 计算表达式的值', async function (done) {
        let env = { userName: "lcm" };
        let stackItem = 'btctrade.btc.account';
        let options = { env: env};
        let res = await expression.getVariableValue(stackItem,options);

        stackItem = 'btctrade.btc.account.total';
        res = await expression.getVariableValue(stackItem,options);

        stackItem = 'btctrade.btc.account.total0';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res == stackItem,true);

        stackItem = 'btctrade.btc.bids[0].amount';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'btctrade.btc.bids[0].price';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'btctrade.btc.asks[0].price';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'btctrade.btc.asks[0].amount';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'aaabbb';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res == stackItem,true);

        //bitvc.btc.fee
        //bitvc.btc.fee.pay
        //bitvc.btc_week.fee.maker_buy
        stackItem = 'bitvc.btc.fee.pay';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'bitvc.btc_7d.fee';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'bitvc.btc_7d.fee.maker_buy';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'bitvc.btc_7d.fee.buy_maker';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        stackItem = 'bitvc.btc_7d.fee.settlement';
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        
        stackItem = 'bitvc.btc.index'; //指数价格
        res = await expression.getVariableValue(stackItem,options);
        assert.equal(res > 0,true);

        done();
    });

})