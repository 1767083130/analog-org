'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferStrategy = mongoose.model('TransferStrategy');
const Strategy = mongoose.model('Strategy');

const async = require('co').wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const configUtil = require('../../lib/utils/configUtil');
const Decimal = require('decimal.js');

module.exports = function (router) {
    router.get('/', async function(req, res) {
        try{
            let userName = req.user.userName;
            let accounts = await Account.getUserAccounts(userName);
            let clients = await ClientIdentifier.getUserClients(userName);
            let transferStrategys = await TransferStrategy.getUserStrategy(userName);
            let strategy = await Strategy.getUserStrategy(userName);

            let business = configUtil.getBusiness();
            business.sites = apiConfigUtil.getSites();
            business.symbols = apiConfigUtil.getSymbols();

            for(let account of accounts){
                for(let coin of account.coins){
                    coin.available = new Decimal(coin.total).minus(coin.total,coin.frozen).toNumber();
                }
            }

            // var clientId = clients[0]._id;
            // var timeStamp = clientId.getTimestamp();
            // var id= mongoose.Types.ObjectId(clientId.toString());
            res.render('admin/index', {
                userName: userName,
                business: JSON.stringify(business),
                accounts: JSON.stringify(accounts || []),
                clients: JSON.stringify(clients || []),
                strategy: JSON.stringify(strategy || []),
                transferStrategys: JSON.stringify(transferStrategys || [])
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
}