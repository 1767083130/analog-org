'use strict';
const request = require('request');

let rateUtils = new class {
     getUsdRate(callback){
        let pool = new https.Agent({ keepAlive: true });
        let options = {
            url: 'https://www.okex.com/api/v1/exchange_rate',
            method: 'GET',
            timeout: 10000,
            agent: pool,
            //form: args,
            headers: { "content-Type": "application/x-www-form-urlencoded"},
        };

        var getRes = function(data) {
            try{
                let res = JSON.parse(data);
                res.isSuccess = true;
                return res;
            } catch (err){
                return { isSuccess: false,message: "返回的数据格式错误" }
            }
        }.bind(this);

        if(callback && typeof callback == 'function'){
            request(options, function (err, response, body) {
                if(!err){
                    let res = getRes(body);
                    return callback(err,res);
                } else {
                    return callback(err,res);
                }
            });
        } else {
            let promise = new Promise(function(resolve, reject) {
                request(options, function (err, response, body) {
                    if(err){
                        reject(err);
                    }else{
                        let res = getRes(body);
                        resolve(res);
                    }
                });
            }.bind(this));

            return promise;
        }
     }

}();

module.exports = rateUtils