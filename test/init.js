'use strict';

const co = require('co');
const mongoose = require('mongoose');
const customConfig = require('../config/customConfig');
const database = require('../lib/database');
const crypto = require('../lib/crypto');

let cryptConfig = customConfig.bcrypt;
crypto.setCryptLevel(cryptConfig.difficulty);

let dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const testUtil = require('./testUtil');

let initLib = new class{
    constructor(){
        this.databaseStatus = 0;
        this.clientStatus = 0;
    }

    initDatabase(){
        return new Promise(function(resolve,reject){
            if(this.databaseStatus == 1){
                resolve();
                return;
            }

            const db = mongoose.connection;
            db.once('open',async function callback(){
                console.log('数据库成功连接');
                
                await testUtil.init();
                this.databaseStatus = 1
                resolve();
                
            }.bind(this));
        }.bind(this))
    }

}

before(async function() {
    console.log('开始初始化测试数据..');
    await initLib.initDatabase();
    console.log('测试数据初始化完毕。');
});

module.exports = initLib;