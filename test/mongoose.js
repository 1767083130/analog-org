'use strict';

var query = require('querystring'),
    request = require('supertest'),
    co = require('co');

//const app = require('../index.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');

describe('支付测试. path: strategy.js', function () {


    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('todo', function (done) {
        co(function *(){
            let accounts = yield Account.getUserAccounts("lcm")
            done();
        }).catch(function(e){
            done(e);
        });
    });
})
