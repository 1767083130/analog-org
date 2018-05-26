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
const configUtil = require('../lib/utils/configUtil');
const apiConfigUtil = require('../lib/apiClient/apiConfigUtil');
const Decimal = require('decimal.js');

module.exports = function (router) {
    //router.get('/', account.index_api);
  
    router.get('/',  async function(req, res) {
        let userName = req.user.userName;
        let accounts = await Account.getUserAccounts(userName);
        let clients = await ClientIdentifier.getUserClients(userName);
        let transferStrategys = await TransferStrategy.getUserStrategy(userName);
        
        let business = configUtil.getBusiness();
        business.sites = apiConfigUtil.getSites();
        business.symbols = apiConfigUtil.getSymbols();

        for(let account of accounts){
            for(let coin of account.coins){
                coin.available = new Decimal(coin.total).plus(coin.frozen).toNumber();
            }
        }

        let strategy = await Strategy.getUserStrategy(userName);

        // var clientId = clients[0]._id;
        // var timeStamp = clientId.getTimestamp();
        // var id= mongoose.Types.ObjectId(clientId.toString());
        res.render('index', {
            userName: userName,
            business: JSON.stringify(business),

            accounts: JSON.stringify(accounts || []),
            clients: JSON.stringify(clients || []),
            strategy: JSON.stringify(strategy || []),
            transferStrategys: JSON.stringify(transferStrategys || [])
        });
    });

    router.get('/profile', function(req, res) {
        res.render('profile', { user: req.user });
    });

    router.get('/admin', function(req, res) {
        res.render('admin', {});
    });

    //Allow the users to log out 
    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/login');
    });


};


