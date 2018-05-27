'use strict';

const $ = require('jquery')(require("jsdom").jsdom().defaultView);
//const $ = require('jquery');
const http = require('http');  
const Decimal = require('decimal.js');
const assert = require('assert');
const request = require('request');

describe('jQuery在服务器端的使用实例。path: demo/jquery.js', function () {
    before(function (done) {
        done();
    });

    it('jQuery 使用实例', function (done) {
        $("body").append("<div>TEST</div>");
        assert.equal($("body div").html() == 'TEST',true);

        request({
            url: "http://www.baidu.com",
            method: "GET"
        }, function (error, response, body) {
              assert.equal($(body).find('div a').length > 0, true);
              done();
        });

    });
})
