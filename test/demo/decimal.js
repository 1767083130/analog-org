'use strict';

const Decimal = require('decimal.js');
const assert = require('assert');

describe('支付测试. path: demo/decimal.js', function () {
    //使用文档详见： http://mikemcl.github.io/decimal.js/#Dceil
    it('Decimal 使用实例', function (done) {
        let x = new Decimal(0.8), y = new Decimal(0.7);

        assert.equal(new Decimal(1.5).equals(x.plus(y)),true); //相加
        assert.equal(new Decimal(0.1).equals(x.minus(y)),true); //相减  

        assert.equal(new Decimal(1.14286).equals(x.div(y).toFixed(5)),true); //相除后四舍五入
        assert.equal(new Decimal(1.1429).equals(x.div(y).toFixed(4)),true); 
        assert.equal(new Decimal(1.14).equals(x.div(y).toFixed(2)),true); 

        assert.equal(new Decimal(0.69879878987).toDP(6, Decimal.ROUND_DOWN).equals(0.698798),true);// 同名toDecimalPlaces, 这里相当于阶段小数点后6位
    
        //Ceil是向上取整。。floor是向下取整
        assert.equal(new Decimal(2).equals(x.div(y).ceil()),true);
        assert.equal(new Decimal(1).equals(x.div(y).floor()),true);

        assert.equal((new Decimal(1).div(3)).equals(0.33333333333333333333),false);
        assert.equal((new Decimal(1).div(3)).equals('0.33333333333333333333'),true);
        assert.equal((new Decimal(1).div(3)).toNumber() === 0.33333333333333333333,true);

        assert.equal(new Decimal(0.56).equals(x.times(y)),true);
        done();
    });
})