'use strict';

var request = require('supertest'),
    co = require('co'),
    transfer = require('../../lib/transfer');

describe.skip('支付测试. path: transfer.js', function () {
    var env;

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        env = process.env.env;
        process.env.env = 'development';

        done();
    });
    
    after(function(done){
        process.env.env =  env;
        done();
    })

    it.skip('runOrderOperate 执行需要委托交易的差价策略的step',async function (done) {
        let operateLog = {
        
        };
        let stepAmount = 10;
        let identifier = {};

        /**
         * 执行需要委托交易的差价策略的step
         * @param {Object} 对应TransferStrategyLog的operates项
         * @param {ClientIdentifier} identifier,可为空
         * @param {stepAmount} 差价策略的step的金额
         * @returns {Object} 是否成功。如{
             { isSuccess: true, //是否成功
                actionId: newOrder._id, //委托Id
                order: newOrder } //委托交易
            * @public
            */
        let res = await transfer.runOrderOperate(operateLog,identifier,stepAmount);
        assert.equal(res.isSuccess,true);

        done();
    });

    it.skip('cancelOrder 取消委托',async function (done) {
        /**
         * 取消订单
         * 
         * @param {Order} order
         * @identifier {ClientIdentifier} identifier
         * @returns 如{ isSuccess: false, errorCode: "100006",message: "参数错误。order不能为空" }
         * @public
         */
        let res = await transfer.cancelOrder(order,identifier);
        assert.equal(res.isSuccess,true);
        done();
    });

    it.skip('syncRecentOrders 同步最近委托状态', async function (done) {
        /**
         * 同步第三方交易平台和本系统间的订单状态,如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
         *
         * @param {Function(err, response)} stepCallBack
         * @public
         */
        await transfer.syncRecentOrders(function(err,res){
            assert.equal(res.isSuccess,true);
            done();
        });
    });


})
