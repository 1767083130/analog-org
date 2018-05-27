'use strict';

const mongoose = require('mongoose');
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const AccountHistory = mongoose.model('AccountHistory');
const Api = require('./apiClient/api');
const Decimal = require('decimal.js');

const co = require('co');
const realTimePrice = require('./realTimePrice');
const configUtil = require('./utils/configUtil');
const common = require('./common');

const Natural_Symbol = configUtil.getNaturalCoin();
const UseCost = true; 

/**
 * 对冲交易
 */
let hedging = new class{


}();

module.exports = hedging;