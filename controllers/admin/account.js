'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferStrategy = mongoose.model('TransferStrategy');
const Strategy = mongoose.model('Strategy');

const async = require('co').wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const configUtil = require('../../lib/utils/configUtil');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const Decimal = require('decimal.js');

module.exports = function (router) {
    //router.get('/', account.index_api);
  
    router.get('/', async function(req, res) {
        try{
            let userName = req.user.userName;
            let accounts = await Account.getUserAccounts(userName);
            let clients = await ClientIdentifier.getUserClients(userName);

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
            res.render('account', {
                userName: userName,
                business: JSON.stringify(business),
                accounts: JSON.stringify(accounts || []),
                clients: JSON.stringify(clients || [])
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/syncAccounts', async function(req, res) {
        try{
            let sites = req.body.sites;
            let userName = req.user.userName;
            let results = await accountLib.syncUserAccounts(sites,userName);

            res.json(results);
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.get('/getAccounts', async function(req, res) {
        try{
            if(!req.user){
                return res.status(403).redirect('/login');
            }

            let userName = req.user.userName;
            let accounts = await Account.getUserAccounts(userName);

            res.json({ isSuccess: true,accounts: accounts });
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });


    router.post('/updateClient', async function(req, res) {
        try{
            if(!req.body.site){
                return res.json({ isSuccess: false,message: "参数site不能为空" });
            }
    
            let userName = req.user.userName;
            let client = await ClientIdentifier.findOne({site: req.body.site, userName: userName });
            if(!client){
                client = new ClientIdentifier();
            }
            client.userName = userName;

            Object.assign(client,only(req.body,'site appKey appSecret'));
            client = await client.save();

            res.json({ isSuccess: true,client: client });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/toggleClientValid', async function(req, res) {
        if(!req.body.site){
            return res.json({ isSuccess: false });
        }

        let userName = req.user.userName;
        let client = await ClientIdentifier.findOne({site: req.body.site, userName: userName });
        if(client){
            client.isValid = !client.isValid;
        }

        res.json({ isSuccess: true });
    });


    router.post('/saveCoinAddress', async function(req, res) {
        try{
            let address = req.body.address;
            if(!address || !address.site || !address.coin){
                return res.json({ isSuccess: false });
            }

            let userName = req.user.userName;
            let client = await ClientIdentifier.findOne({site: address.site, userName: userName });
            if(!client){
                client = new ClientIdentifier({ userName: userName, site: address.site });
            }

            let addresses = client.coinAddresses || [];
            let coinAddress = addresses.find(function(item){
                return item.coin == address.coin;
            });
        
            if(!coinAddress){
                coinAddress = {
                    coin: address.coin,
                    address: address.address,
                    fee: address.fee
                };
                addresses.push(coinAddress);
            } else {
                coinAddress.coin = address.coin;
                coinAddress.address = address.address;
                coinAddress.fee = address.fee;
            }
            
            client = await client.save();
            res.json({ isSuccess: client ? true : false });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/deleteCoinAddress', async function(req, res) {
        try{
            if(!req.body.address){
                return res.json({ isSuccess: false });
            }

            let userName = req.user.userName;
            let address = req.body.address;
            if(!address || !userName){
                return res.json({ isSuccess: false });
            }

            let client = await ClientIdentifier.findOne({site: address.site, userName: userName });
            if(!client){
                return res.json({ isSuccess: false });
            }

            let addresses = client.coinAddresses || [];
            let index = addresses.findIndex(function(item){
                return item.coin == address.coin;
            });

            if(index != -1){
                client.coinAddresses.splice(index,1);
            }

            client = await client.save();
            res.json({ isSuccess: client ? true : false });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
}

