'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const orderLib = require('../lib/order');
const realTimePrice = require('../lib/realTimePrice');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const CacheClient = require('ws-server').CacheClient;
const transferController = require('../lib/transferStrategys/transferController');
const ClientIdentifier = mongoose.model('ClientIdentifier');
const User = mongoose.model('User');
const Order = mongoose.model('Order');
const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');
const Decimal = require('decimal.js');

/**
 * 修改订单价格
 */

const SYMBOL = 'eos#usd';
const SITE = 'bitfinex';
// const SYMBOL = 'eth#usd_1w';
// const SITE = 'okex';

const INTERVAL = 15 * 1000; //15s
const CLIENT_TYPE = "client" 
const MIN_STEP_AMOUNT = 1;
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

process.on('uncaughtException', function(e) {
    console.error(e);
});

let db = mongoose.connection;
db.once('open',function callback(){
    console.log('数据库连接成功');
    if(cacheClient.readyState == CacheClient.OPEN){
        setTimeout(runStrategys,INTERVAL);
    } else {
        cacheClient.start(async function(){
            let client = cacheClient.getClient();
            //处理返回的数据
            client.on('message', async function(res){ 
                //console.log(JSON.stringify(res));
                switch(res.channel){
                case 'order':
                    if(res.isSuccess){
                        await onOrderMessage(res);
                    }
                    break;
                case 'trade':
                    //console.log(JSON.stringify(res));
                    break;
                }
            }.bind(this));

            client.on('pong',function(){
                console.log('pong');
            })

            setTimeout(async function() {
                let createOrderRes = await createTestOrder();
                if(createOrderRes.isSuccess){
                    let renewOrderRes = await renewOrder(createOrderRes.order);
                    console.log(JSON.stringify(renewOrderRes));
                } else {
                    console.log(createOrderRes.message);
                }
            },10000);
        });    
    }
});

testGetMarketPrice();

function testGetMarketPrice(){
    let depths = {
        bids: [[1,19],[0.5,20]],
        asks:[[2,8],[3,50]]
    };
    let operateType = 'buy';
    let options = {
        ignoreStepsCount: 1,
        ignoreAmount: 10
    }
    let marketPrice = orderLib.getMarketPrice(depths,operateType,options)
    if(marketPrice != 3.1){
        throw new Error(`getMarketPrice方法有误.预期值为3.1，而实际值为${marketPrice}`)
    }
}

/**
 * 处理订单信息
 * @param {Array} apiOrders 
 */
async function onOrderMessage(res){
    let apiOrders = res.data;
    let site = res.site;

    /**
     * apiOrder数据结构
        outerId: apiOrder.id,
        symbol: common.getApiSymbol(apiOrder.symbol,true),
        type: type, //“LIMIT”, “MARKET”, “STOP”, “TRAILING_STOP”, “EXCHANGE_MARKET”, “EXCHANGE_LIMIT”, “EXCHANGE_STOP”, “EXCHANGE_TRAILING_STOP”, “FOK”, “EXCHANGE_FOK”
        status: status,//status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                        //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                        //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
        dealAmount: apiOrder.amount, //已处理数量
        amount: apiOrder.amountOrig, //已委托数量
        created: +apiOrder.mtsCreate,
        price: apiOrder.price,
        avgPrice: apiOrder.priceAvg,
        hidden: apiOrder.hidden,
        maker: apiOrder.maker
     */
    try{
        for(let apiOrder of apiOrders){
            apiOrder.site = site;
            let order = await Order.findOne({ outerId: apiOrder.outerId,site: site });
            if(!order){
                continue;
            }

            let stepAmount = new Decimal(apiOrder.dealAmount).minus(order.bargainAmount).toNumber(); //更改帐户的金额
            let newOrder = await orderLib.refreshOrder(order, apiOrder);

            newOrder.changeLogs = res.orgData;
            newOrder = await newOrder.save();

            let e = {
                order: newOrder, //变更后的订单
                stepAmount: stepAmount //变更的额度
            };
            await transferController.onOrderStatusChanged(e);
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * 执行需要委托交易的差价策略的step
 * @param {Object} logOperate,对应TransferStrategyLog的operates项
 * @param {Object} options
 * @param {ClientIdentifier} [options.identifier], 可为空
 * @param {Number} options.stepAmount,差价策略每次委托金额
 * @param {Array} [options.depths] 市场深度
 * @returns {Object} 是否成功。如{
     { isSuccess: true, //是否成功
        actionId: newOrder._id, //委托Id
        order: newOrder } //委托交易
    * @public
    */
async function createTestOrder(){
    const AMOUNT = -2;
    const SIDE = 'buy';

    let res = { isSuccess: false };
    let getDepthsRes = realTimePrice.getSymbolDepths(SITE,SYMBOL);
    if(!getDepthsRes.isSuccess){
        return  { isSuccess: false, errorCode: "100003", message: "获取市场行情失败" };   
    }

    let newDepths = getDepthsRes.data;
    if(!newDepths){
        return  { isSuccess: false, errorCode: "100003", message: "获取市场行情失败" };    
    }

    let operateType = SIDE; 
    if(AMOUNT < 0){
        operateType = (operateType == 'buy' ? 'sell' : 'buy');
    }
    let price = _getPostOnlyPrice(newDepths,operateType);
    let order = {
        site: SITE, //平台名称
        userName: 'lcm', 
        isTest: false,
        side: SIDE, //buy或sell
        leverage:  1,
        reason: "transfer", //原因
        symbol: SYMBOL, //cny、btc、ltc、usd
        consignDate: new Date(), //委托时间
        
        isPostOnly: true,
        price: price, //委托价格
        amount: AMOUNT, //总数量

        consignAmount: AMOUNT, //已委托数量
        //bargainAmount:  { type: Number, "default": 0 }, //已成交数量
        //prarentOrder: { type: Schema.ObjectId },
        //childOrder: { type: Schema.ObjectId }, 
        //actionId: transferStrategyLog._id,
        //operateId: logOperate.id, //操作Id
        isSysAuto: true,
        //outerId: String,  //外部交易网站的Id
        status: "wait", 

        created: new Date(), //创建时间
        modified: new Date() //最近修改时间
    };

    res = await orderLib.createOrder(order);
    return res;
}

function _getPostOnlyPrice(depths,operateType,priceSteps = 120){
    let options = {
        ignoreStepsCount: 45
    };
    let postOnlyPrice = orderLib.getPostOnlyPrice(depths,operateType,options);
    return postOnlyPrice;
}

async function renewOrder(order){
    try {
        let res = await orderLib.updateOrderPrice(order);
        return res;
    } catch (err){
        order.autoRetryFailed++;
        order.save();
        console.error(err);
        return { isSuccess: false, message: "服务器端错误"}
    }
}
