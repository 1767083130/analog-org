// 'use strict';

// var request = require('supertest'),
//     assert = require('assert'),
//     co = require('co'),
//     SocketClient = require('../../../lib/apiClient/socketClient');

// const SYMBOL = 'eth#cny';
// //testApi('yunbi');
// testApi('bitmex');
// //testApi('chbtc');

// function testApi(site){
//     describe(`api. path: lib/platforms/socketClient.js 网站：${site}`, function () {
//         let client,
//             sellId,buyId; //卖单ID

//         //有比较耗时间的测试，设置每个测试的过期时间为1分钟
//         this.timeout(1 * 60 * 1000);

//         before(function (done) {
//             client = new SocketClient(site);
//             done();
//         });

//         it('connect 可以连接并且能获取到数据', function (done) {
//             client.connect();
//             done();
//         });
//     })
// }