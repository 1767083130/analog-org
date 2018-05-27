'use strict';

var query = require('querystring'),
    request = require('supertest'),
    assert = require('assert'),
    transferStatusChecker = require('../../../lib/apiClient/transferStatusChecker'),
    co = require('co');

describe('判断转币状态测试. path:lib/platforms/transferStatusChecker.js', function () {

    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('checkStatus 判断转币是否成功', async function (done) {
        let transfer = { userName:"lcm",target: "btctrade", amount: 10,accountAmount:90 };
        let transfers = [{ userName:"lcm",target: "btctrade",amount: 3,accountAmount:90 },{ userName:"lcm",target: "btctrade",amount: 8,accountAmount:90 }];
        let options = { transfers: transfers };

        let res = await transferStatusChecker.checkStatus(transfer,options);
        assert.equal(res.isSuccess, true);  //执行成功

        done();
    });

    it('arrayCombine 获得指定数组的所有组合', function (done) {
        let targetArr = [5.21,8,46,1.11];
        let totalAmount = 6.32;
        let arr = transferStatusChecker.arrayCombine(targetArr,totalAmount); 
        assert.equal(arr.length, 2);

        done();
    });

    it('getFlagArrs 获得从m中取n的所有组合', function (done) {
        var flagArrs = transferStatusChecker.getFlagArrs(2, 1);
        assert.equal(flagArrs.length, 2);

        flagArrs = transferStatusChecker.getFlagArrs(4, 2);
        assert.equal(flagArrs.length, 6);
        done();
    });
})
