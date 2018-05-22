'use strict';

const mongoose = require('mongoose');
const co = require('co');

const ClientIdentifier = mongoose.model('ClientIdentifier');
const User = mongoose.model('User');
const Account = mongoose.model('Account');

let testUtil = new class{
    constructor(){
        this.client = null;
    }

    // getClient(options){
    //     if(!this.client){
    //         this.client = new Client(options);
    //     } 

    //     return this.client;
    // }

    async init(){
        await this.getTestAccount();
        await this.addUsers();
    }
    
    async addUsers() { //add two users
        let userName = 'lcm';
        let user = await User.findOne({ userName: userName });
        if(!user){
            var u1 = new User({
                name: 'Kraken McSquid',
                userName: 'lcm',
                password: 'lcm',
                role: 'admin'
            });

            var u2 = new User({
                name: 'Ash Williams',
                userName: 'zjp',
                password: 'zjp',
                role: 'user'
            });

            //Ignore errors. In this case, the errors will be for duplicate keys as we run this app more than once.
            await u1.save();
            await u2.save();
        }
    }
    
    async getTestAccount(reset){
        var _account = {
            site: "btctrade", //平台名称
            userName: "lcm", 
            isTest: false, //是否为测试帐户
            isValid:true, //是否有效
            isLocked: false, //是否locked

            coins: [{
                coin: "eth",
                total: 20000000, //总额 = 可用数 + 冻结数
                frozen: 0, //冻结
                loan: 0, //借贷
                apply: 0,
                cost: 1  //成本
            },{
                coin: "cny",
                total: 100000000
            }],
            
            created: Date.now(),
            modified: Date.now()
        };

        let account = await Account.findOne({ userName: "lcm", site: "btctrade"});
        if(!account){
            account = new Account(_account);
        } 

        if(reset) {
            for(let key in _account){
                account[key] = _account[key];
            }
        }
        account = await account.save();
        return account;
    }

    getAccountCoin(coin,account){
        let coinItem = account.coins.find(function(value,index){
            return value.coin == coin;
        });

        return coinItem;
    }


    getTestRealPrices(){
        let realPrices = [{
            site: "okex", //交易网站
            symbol: "eth#usd", //币种
            bids: [[50.2,1.3],[50.09,1.54],[50,1.45],[49.98,2]], //买入委托，按照价格降序排序
            asks: [[50.58,80],[50.6,100.54],[50.89,1.45],[51,200]] //卖出委托，按照价格升序排序
        },{
            site: "bitfinex", //交易网站
            symbol: "eth#usd", //币种
            bids: [[50.8,13],[50.71,1.54],[50.6,1.45],[50.4,123],[50.3,43]], //买入委托，按照价格降序排序
            asks: [[50.9,1.3],[51,154],[51.56,145.9]] //卖出委托，按照价格升序排序
        }];  

        return realPrices;
    }
}();

module.exports = testUtil

