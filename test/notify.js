// var 
//     query = require('querystring'),
//     request = require('supertest'),
//     assert = require('assert');
// var app = require('../index.js');

// describe('支付测试. path: notify.js', function () {

//     before(function (done) {
//         done();
//     });

//     it('GET /pay/createSession 新建支付单', function (done) {
//         var testApp = app.kraken.get('test:testApp');
//         request(app)
//             .get('/pay/createSession?' + query.stringify({
//                 appKey: testApp.appKey,
//                 amount: 12,
//                 distinctId: "123445",
//                 tradeId: "a234dwer4235"
//             }))
//             .expect(200, function (err, res) {
//                 if (err) return done(err);
//                 assert.equal(res.body.isSuccess, true);
//                 done();
//             });
//     });

// })