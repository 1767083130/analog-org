'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const orderLib = require('../lib/order');
const realTimePrice = require('../lib/realTimePrice');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const CacheClient = require('ws-client').CacheClient;
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

// const SYMBOL = 'eos#usd';
// const SITE = 'bitfinex';
const SYMBOL = 'eos#usd_1w';
const SITE = 'okex';
const ISPOSTONLY = false;

const INTERVAL = 15 * 1000; //15s
const CLIENT_TYPE = "client" 
const MIN_STEP_AMOUNT = 1;
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

process.on('uncaughtException', function(e) {
    console.error(e);
});

let db = mongoose.connection;
db.once('open',async function callback(){
    console.log('数据库连接成功');
    let testOrder = await createTestOrder();
    let res = {
        "outerId":'1',
        "symbol":"eos#usd_0727",
        "type":"LIMIT",
        "status":"canceled",
        "amount":-170,
        "dealAmount":-60,
        "side":"buy",
        "created":null,
        "price":8.5
    };
    for(let i = 0; i < 10; i++){
        onOrderMessage(res);
    }
});

let isFirst = true;

/**
 * 处理订单信息
 * @param {Array} apiOrders 
 */
async function onOrderMessage(apiOrder){
    let realDealAmount = orderLib.getRealAmount(apiOrder.dealAmount,apiOrder.avgPrice || apiOrder.price,apiOrder.symbol,apiOrder.unit);
    let realAmount = orderLib.getRealAmount(apiOrder.amount,apiOrder.price || apiOrder.avgPrice,apiOrder.symbol,apiOrder.unit);

    let order = await Order.findOneAndUpdate({ 
        outerId: 1,
        site: 'okex',
        reason: 'transfer'
    },{
        $set: { 
            consignAmount: realAmount,
            bargainAmount: realDealAmount,
            status: apiOrder.status,
            apiStatus: apiOrder.status,
            modified: new Date()
        }
    }, {
        new: false
    });
    if(!order) return;

    let stepAmount = new Decimal(realDealAmount).minus(order.bargainAmount).toNumber(); //更改帐户的金额
    let realUnDealAmount = order.consignAmount - realDealAmount;

    if( ['canceled','success','failed'].indexOf(order.apiStatus) == -1 ){
        if(!isFirst){
            throw new Error('dddddddd');
        }
    }

    console.log(`stepAmount: ${stepAmount}`);
    isFirst = false
    return order;
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
    const AMOUNT = 1;
    const SIDE = 'buy';
    const ISPOSTONLY = false;
    const SITE = 'okex';
    const SYMBOL = 'eos#usd_1w';

    let oldOrder = await Order.findOne({ outerId: 1});
    if(oldOrder){
        return oldOrder;
    }

    let operateType = SIDE; 
    if(AMOUNT < 0){
        operateType = (operateType == 'buy' ? 'sell' : 'buy');
    }
    let price = 9;
    let options = {
        site: SITE, //平台名称
        userName: 'lcm', 
        isTest: false,
        side: SIDE, //buy或sell
        leverage:  1,
        reason: "transfer", //原因
        symbol: SYMBOL, //cny、btc、ltc、usd
        consignDate: new Date(), //委托时间
        
        isPostOnly: ISPOSTONLY,
        price: price, //委托价格
        amount: AMOUNT, //总数量

        consignAmount: AMOUNT, //已委托数量
        //bargainAmount:  { type: Number, "default": 0 }, //已成交数量
        //prarentOrder: { type: Schema.ObjectId },
        //childOrder: { type: Schema.ObjectId }, 
        //actionId: transferStrategyLog._id,
        //operateId: logOperate.id, //操作Id
        isSysAuto: true,
        outerId: '1',  //外部交易网站的Id
        status: "wait", 

        created: new Date(), //创建时间
        modified: new Date() //最近修改时间
    };

    let orderModel = new Order(options);
    let order = await orderModel.save();
    return order;
}