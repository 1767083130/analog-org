'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferStrategy = mongoose.model('TransferStrategy');
const Strategy = mongoose.model('Strategy');

const async = require('co').wrap;
const only = require('only');
const accountLib = require('../lib/account');
const Decimal = require('decimal.js');

module.exports = function (router) {
    router.get('/depth',  async(function* (req, res) {
        //行情深度查询
        res.render('admin/depth');
    }));

    router.get('/variable',  async(function* (req, res) {
        //计算表达式值
        res.render('admin/variable');
    }));
}