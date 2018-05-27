'use strict';

const stopLoss = require('../../../lib/strategys/stopLoss');
const co = require('co');
const mongoose = require('mongoose');
const StopLoss = mongoose.model('StopLoss');

describe('支付测试. path: strategys/stopLoss.js', function () {


    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('getStopLossLog 获取将要运行的止损止赢操作', function (done) {
        
        co(function *(){
            stopLoss.getStopLossLog()
            done();
        }).catch(function(e){
            done(e);
        });
    });
});

function getSimpleStopLoss(){
    let stopLoss = new StopLoss({
        userName: "lcm",
        symbol: "btc", //货币类型
        //priceSite: String, //价格参照的网站
        isTest: false,
        isValid: true ,
        channel: 0, //运行通道。预留字段，客户不多，暂时没有必要实现 
        lastRunTime: null, //最近一次运行时间 

        steps: [{
            /* 止损 */
            isValid: { type: Boolean,default: true },
            startPrice: { type: Number }, //止损和移动止损的起始参考价格  
            loss: Number, //止损价格。为幅度，比如5，表示5%
            position: { type:String, default: '100%' }, //数量，可以为20或10%这两种方式，默认为100%
            delay: { type: Number,default: 0 },  //等待时间。如果在等待的时间内已经上去，则不执行
            lossRange: { type:Number,default: 0 }, //止损容忍的偏差范围。为幅度，比如5，表示5%
            direction: { type: String,default: 'down' }, //分为两种，up、down
            operateType: { type: String, default: 'sell'}, //分为两种，buy、sell

            /* 移动止损 */
            trailingStop: Boolean,  //是否移动止损
            trailingRange: Number, //移动止损上移幅度
            
            /* 强制执行止损 */
            forceStop: { type: Boolean,default: false}, //当止损失败时，是否强制执行
            forceStopDelay: { type: Number,default: 0 }, //止损失败后等待的时间,单位为秒
            forceStopRange: Number,  //强制执行止损能容忍的价差

            /* 止损后重新上涨，弥补止损错误 */
            reverse:Boolean, //如果止损后重新上涨，是否顺势做多
            reverseRange: Number,  //上移幅度

            /* 止损顺势做多失败后，强制执行 */
            forceReverse: { type: Boolean,default: false}, //当顺势做多失败时，是否强制执行
            forceReverseDelay: { type: Number,default: 0 }, //顺势做多失败后等待的时间,单位为秒
            forceReverseRange: Number //能容忍的价差
        }],
    });

    return stopLoss;
}

function getStopLoss(){

    
}
