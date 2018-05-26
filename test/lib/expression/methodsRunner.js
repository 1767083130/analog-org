'use strict';

const co = require('co');
const assert = require('assert');
const MethodsRunner = require('../../../lib/expression/methodsRunner');
const expression = require('../../../lib/expression/expression');

describe('支付测试. path: expression/methodsRunner.js ', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('calculate 计算函数的值',async function(done) {
        let envOptions = {
            env: {
                userName: 'lcm'
            }
        };

        let getVarValueMethod = async function(stackItem){
            return await expression.getVariableValue(stackItem,envOptions);
        };
        let options = {
            getVarValueMethod: getVarValueMethod
        };

        let methodsRunner = new MethodsRunner(options);
        
        // let express = 'btctrade.btc.bids[0].price';
        // let buyPrice = await expression.getVariableValue(express,envOptions);

        let express = 'min(1,0.1,btctrade.btc.bids[0].price,btctrade.btc.asks[0].price,btctrade.btc.asks[1].price)'.toLowerCase(); 
        let res = await methodsRunner.calculate(express);
        assert.equal(0.1,res);

        // express = 'Min(Btctrade.btc.bids[0].price, btctrade.btc.asks[0].price,btctrade.btc.asks[1].price)'.toLowerCase(); 
        // res = await methodsRunner.calculate(express);
        // assert.equal(buyPrice,res);

        res = eval('methodsRunner.min(3,8)');
        res = await eval('methodsRunner.min(3,8)');
        assert.equal(res,3);

        express = 'min(max(5,6,4),min(8,9,3,12)) > 0'.toLowerCase();
        res = await methodsRunner.calculate(express);
        assert.equal(res,3);

        done();
    });

})