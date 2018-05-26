'use strict';
const request = require('request');
const API_KEY = '2beae1036c77bf85f08c3aad37188f7e'; 

/**
 * 汇率数据获取接口。
 * 详细文档见 https://www.juhe.cn/docs/api/id/23
 */
let exchangeRate = new class {
    constructor(){
    }

    /**
     * 获取人民币牌价。指100外币兑人民币
     */
    getRmbQuot(){
        const apiUrl = `http://web.juhe.cn:8080/finance/exchange/rmbquot?key=${API_KEY}`;
        request({
            url: apiUrl,
            method: "GET"
        }, function (error, response, body) {
            assert.equal($(body).find('div a').length > 0, true);
            done();
        });
    }


    /**
     * 外汇汇率查询
     */
    getFrate(){
        const apiUrl = `http://web.juhe.cn:8080/finance/exchange/frate?key=${API_KEY}`;
        request({
            url: apiUrl,
            method: "GET"
        }, function (error, response, body) {
              assert.equal($(body).find('div a').length > 0, true);
              done();
        });
    }

}();

module.exports = exchangeRate;