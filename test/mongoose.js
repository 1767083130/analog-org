'use strict';

var query = require('querystring'),
    request = require('supertest'),
    co = require('co');

//const app = require('../index.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');

describe('数据库连接测试. path: mongoose.js', function () {


    //有比较耗时间的测试，设置每个测试的过期时间为1分钟
    this.timeout(1 * 60 * 1000);

    before(function (done) {
        done();
    });
    
    after(function(done){
        done();
    })

    it('#async function', async (done) => {
        let r = await 1;
        //done();
        //assert.strictEqual(r, undefined);
    });

    // it('#async function', async (done) => {
    //     //let accounts = await Account.getUserAccounts("lcm")
    //     let a = await 1;
    //     done();
    // });

    // it('todo', async function (done) {
    //     let accounts = await Account.getUserAccounts("lcm")
    //     done();
    // });
})
