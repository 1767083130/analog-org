'use strict';
const request = require('request');
const API_KEY = '2beae1036c77bf85f08c3aad37188f7e'; 

let exchangeRate = new class {
    constructor(){
    }

    getTicker(){
        const apiUrl = `http://web.juhe.cn:8080/finance/exchange/rmbquot?key=${API_KEY}`;
        request({
            url: apiUrl,
            method: "GET"
        }, function (error, response, body) {
        });
    }

    getGlobalData(){
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