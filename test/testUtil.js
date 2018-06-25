'use strict';

const mongoose = require('mongoose');
const co = require('co');
const orderController = require('../lib/order');

const ClientIdentifier = mongoose.model('ClientIdentifier');
const User = mongoose.model('User');
const Account = mongoose.model('Account');
const StrategyPlan = mongoose.model('StrategyPlan');
const TransferStrategy = mongoose.model('TransferStrategy');
const BaseStrategyRunner = require('../lib/transferStrategys/baseStrategyRunner');
const NormalStrategyRunner = require('../lib/transferStrategys/normalStrategyRunner');
const Client = require('ws-client').Client;

let testUtil = new class{
    constructor(){
        this.client = null;
    }

    getClient(options){
        if(!this.client){
            this.client = new Client(options);
        } 

        return this.client;
    }
  
    async getTestTransferStrategys(){
        let strategys = [];
        let transferStrategy = await TransferStrategy.findOne({
            userName: "lcm",
            name: "test0"
        });
        if(!transferStrategy){
            transferStrategy = new TransferStrategy({
                userName: "lcm", 
                isTest: true,
                openType: "private", 
                priceRange: 0.1, //未成功的交易价格容忍度，如0.5，表示0.5%的价差
                name: "test0",
                //itemId: { type: Schema.ObjectId },
                isSimple: false,  //是否为简单模式
                isValid: true,
                conditions: ['(okex.eth#usd_1w.buy - bitfinex.eth#usd.sell) / bitfinex.eth#usd.sell > 0.8%'], //需要满足的条件
                strategyType: "normal" , //策略类型。现在支持between、normal两种
                operates: [{

                    id: 1, //从1开始记数。1,2,3,4,5 ...
                    site: "bitfinex", //平台名称

                    action: "trade",  //操作类型。分为 trade(成交)、transfer（转币）两种
                    side: "buy", //buy或sell。当action=trade时有效

                    //transferSource: String, //移动路径源交易所,当action=transfer时有效，如 transferSource = 'huobi',transferTarget = 'btctrade'，表示从huobi移向btctrade
                    //transferTarget: String, //移动路径目标交易所

                    minStepAmount: 0.1,
                    symbol: "eth#usd", //btc#cny、btc、ltc、usd。 注意，当action=trade时，为btc#cny; 当action=transfer时，为btc
                    previousOperate: 0,
                    nextOperate: 2,
                    orderAmount: 1  //比如 5 或者 5%,数字表示多少个，百分比表示账户总额中的百分之多少
                },{

                    id: 2, //从1开始记数。1,2,3,4,5 ...
                    site: "okex", //平台名称
                    action: "trade",  //操作类型。分为 trade(成交)、transfer（转币）两种
                    side: "sell", //buy或sell。当action=trade时有效
                    //transferSource: String, //移动路径源交易所,当action=transfer时有效，如 transferSource = 'huobi',transferTarget = 'btctrade'，表示从huobi移向btctrade
                    //transferTarget: String, //移动路径目标交易所
                    minStepAmount: 0.1,
                    symbol: "eth#usd_1w",  //btc#cny、btc、ltc、usd。 注意，当action=trade时，为btc#cny; 当action=transfer时，为btc
                    previousOperate: 1,
                    nextOperate: 0,
                    orderAmount: 1 //"btctrade.eth.account.available"  //比如 5 或者 5%,数字表示多少个，百分比表示账户总额中的百分之多少
                }],
                priority: 0, //优先级 
                desc: "String",

                created: Date.now(),
                modified: Date.now()

            });
            transferStrategy = await transferStrategy.save();
        }
        strategys.push(transferStrategy);

        transferStrategy = await TransferStrategy.findOne({
            userName: "lcm",
            name: "test1"
        });
        if(!transferStrategy){
            transferStrategy = new TransferStrategy({
                userName: "lcm", 
                isTest: true,
                openType: "private", 
                priceRange: 0.1, //未成功的交易价格容忍度，如0.5，表示0.5%的价差
                name: "test0",
                //itemId: { type: Schema.ObjectId },
                isSimple: false,  //是否为简单模式
                isValid: true,
                conditions: ['(okex.eth#usd_1w.buy - bitfinex.eth#usd.sell) / bitfinex.eth#usd.sell <= 0.1%'], //需要满足的条件
                strategyType: "normal" , //策略类型。现在支持between、normal两种
                operates: [{

                    id: 1, //从1开始记数。1,2,3,4,5 ...
                    site: "bitfinex", //平台名称

                    action: "trade",  //操作类型。分为 trade(成交)、transfer（转币）两种
                    side: "sell", //buy或sell。当action=trade时有效

                    //transferSource: String, //移动路径源交易所,当action=transfer时有效，如 transferSource = 'huobi',transferTarget = 'btctrade'，表示从huobi移向btctrade
                    //transferTarget: String, //移动路径目标交易所

                    minStepAmount: 0.1,
                    symbol: "eth#usd", //btc#cny、btc、ltc、usd。 注意，当action=trade时，为btc#cny; 当action=transfer时，为btc
                    previousOperate: 0,
                    nextOperate: 2,
                    orderAmount: 1  //比如 5 或者 5%,数字表示多少个，百分比表示账户总额中的百分之多少
                },{

                    id: 2, //从1开始记数。1,2,3,4,5 ...
                    site: "okex", //平台名称
                    action: "trade",  //操作类型。分为 trade(成交)、transfer（转币）两种
                    side: "buy", //buy或sell。当action=trade时有效
                    //transferSource: String, //移动路径源交易所,当action=transfer时有效，如 transferSource = 'huobi',transferTarget = 'btctrade'，表示从huobi移向btctrade
                    //transferTarget: String, //移动路径目标交易所
                    minStepAmount: 0.1,
                    symbol: "eth#usd_1w",  //btc#cny、btc、ltc、usd。 注意，当action=trade时，为btc#cny; 当action=transfer时，为btc
                    previousOperate: 1,
                    nextOperate: 0,
                    orderAmount: 1 //"btctrade.eth.account.available"  //比如 5 或者 5%,数字表示多少个，百分比表示账户总额中的百分之多少
                }],
                priority: 0, //优先级 
                desc: "String",

                created: Date.now(),
                modified: Date.now()

            });
            transferStrategy = await transferStrategy.save();
        }
        strategys.push(transferStrategy);
 
        return strategys;
    }

    async getTestStrategyPlan(){
        let strategyPlan = await StrategyPlan.findOne({
            userName: "lcm",
            name: "test0"
        });
        if(!strategyPlan){
            let strategys = await this.getTestTransferStrategys();
            strategyPlan = new StrategyPlan({
                userName: "lcm", 
                name: "test0",
                strategys: [{ 
                    strategyId: strategys[0]._id,  
                    consignAmount: 0,
                    actualAmount: 0
                },{
                    strategyId: strategys[1]._id,  
                    consignAmount: 0,
                    actualAmount: 0
                }],
                
                isValid: true,
                status: 'wait' , //可能的值： wait, running, success, stopped
                
                stepAmount: 0.1,  //每步执行数量
                totalAmount: 0.3, //需要执行总量。 -1，表示直到满仓为止

                //lastRunTime: Date, //上次执行时间
                interval: 10000, //两次执行的间隔时间，单位为ms

                // startTime: Date,
                // endTime: Date,
                created: Date.now(),
                modified: Date.now()
            });
            strategyPlan = await strategyPlan.save();
        }
        
        return strategyPlan;
    }

    async init(){
        await this.getTestAccount();
        await this.addClients();
        await this.addUsers();
        await this.getTestStrategyPlan();
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

    async addClients(){
        let clients = [];
        let _client = {
            site: "btctrade",
            userName: "lcm",
            appKey: "3frrr-rpuiq-pwtxa-uxdvc-ka4p1-768gg-uiwja",
            appSecret: "Qq!D.-ScVC6-~n$vc-r!AAR-BQ,S9-nERf5-(/v^q",
            safePassword: "360yee",
            coinAddresses: [{ 
                coin: "eth", 
                address: "0x28db98d005b960ffe28bddc4fc09691cdf9be859",
                fee: 0.01
            },{ 
                coin: "btc", 
                address: "1FcB5LAGavgRUGbcEsEB4VAC4YAruLsPuz",
                fee: 0.0001
            }],
            isValid: true,
            created: Date.now(),
            modified: Date.now()
        };
   
        let client = await ClientIdentifier.findOne({ 
            userName: _client.userName,
            site:  _client.site,
            isValid: _client.isValid
        });

        if(!client){
            client = new ClientIdentifier(_client);
        } else {
            for(let key in _client){
                client[key] = _client[key];
            }
        }
        client = await client.save();
        clients.push(client);

        return clients;
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

    /**
     * 获取策略的运行项
     *
     * @params {Obeject} options,可为空。如
       { 
         strategy: strategy,
         realPrices：realPrices，
         accounts: account,
         env: { userName: userName }
       }
     */
    async getTestStrategyLog(options){
        options = options || {};
        if(!options.strategy){
            let strategys = await this.getTestTransferStrategys();
            options.strategy = strategys[0];
        }

        if(!options.realPrices){
            options.realPrices = this.getTestRealPrices();
        }

        if(!options.env){
            options.env = { userName: options.strategy.userName };
        }

        if(!options.accounts){
            options.accounts = await this.getTestAccount();
        }

        //构建测试数据TransferStrategyLog
        let env = { userName: options.strategy.userName };
        let envOptions = {
            realPrices: options.realPrices,
            accounts: options.accounts,
            env: options.env || env
        };

        let baseStrategyRunner = new BaseStrategyRunner();
        let normalStrategyRunner = new NormalStrategyRunner();

        let condition = options.strategy.conditions.join(' && ');
        let conditionResult = await normalStrategyRunner.getConditionResult(condition,envOptions);
        let getLogRes = await baseStrategyRunner.getTransferStrategyLog(conditionResult.orders,options.strategy);
        let strategyLog = getLogRes.log;

        for(let i = 0; i < strategyLog.operates.length;i++){
            strategyLog.operates[i].transferStrategyLog = strategyLog;
        }

        return strategyLog;
    }


    /**
     * 获取运行策略时生成的交易委托
     *
     * @params {String} side，交易委托类型，不能为空，如'buy','sell'
     * @params {Number} stepAmount，委托数量，不能为空
     * @params {Obeject} options,可为空。如
       { 
         strategy: strategy,
         realPrices：realPrices，
         accounts: account,
         env: { userName: userName }
       }
     *
     * @returns {Order} 交易委托
     */
    async getTestOrder(side,stepAmount,options){
        let identifier;
        if(!options.strategy){
            let strategys = await this.getTestTransferStrategys();
            options.strategy = strategys[0];
        }

        let strategyLog = await this.getTestStrategyLog(options);
        let logOperate = strategyLog.operates.find(function(value){
            return value.orgOperate.side == side;
        });

        let res = await orderController.runOrderOperate(logOperate,identifier,stepAmount);
        return res.order;
    }

}();

module.exports = testUtil

