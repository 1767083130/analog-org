'use strict';

const database = require('../lib/database');
const customConfig = require('../config/customConfig');
const mongoose = require('mongoose');

const dbConfig = customConfig.databaseConfig;
database.config(dbConfig);

const orderLib = require('../lib/order');
const realPriceLib = require('../lib/realTimePrice');
const cacheClient = require('../lib/apiClient/cacheClient').getInstance();
const CacheClient = require('ws-client').CacheClient;
const NormalStrategyRunner = require('../lib/transferStrategys/NormalStrategyRunner');
const transferController = require('../lib/transferStrategys/transferController');
const ClientIdentifier = mongoose.model('ClientIdentifier');
const User = mongoose.model('User');
const Order = mongoose.model('Order');
const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');
const StrategyPlan = mongoose.model('StrategyPlan');
const StrategyPlanLog = mongoose.model('StrategyPlanLog');

const Decimal = require('decimal.js'),
    fs= require('fs'),
    path = require('path'),
    positionLib = require('../lib/position'),
    symbolUtil  = require('../lib/utils/symbol');

let datas = []; //e.g {"event":"subscribed","channel":"book","chanId":64,"prec":"P0","freq":"F0","len":"25","pair":"BTCUSD"}
const INTERVAL = 0.5 * 1000; //0.5s
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

process.on('uncaughtException', function(e) {
    console.error(e);
});

let db = mongoose.connection;
db.once('open',function callback(){
    console.log(`数据库连接成功.程序在${NODE_ENV}环境下运行`);
    if(cacheClient.readyState == CacheClient.OPEN){
        setTimeout(runStrategys,INTERVAL);
    } else {
        cacheClient.start(function(){
            console.log(`已成功连接数据服务器. ${cacheClient.options.serverUrl}`);
            console.log('开始跟踪处理委托单..');
            
            let client = cacheClient.getClient();
            //处理返回的数据
            client.on('message', async function(res){ 
                
                switch(res.channel){
                case 'order':
                    if(res.isSuccess){
                        await onOrderMessage(res);
                    }

                    if(NODE_ENV != 'production') {
                        console.log(JSON.stringify(res) );
                        // console.log(JSON.stringify(res));
                        fs.appendFile(path.join(__dirname,'logs', 'log.txt'), JSON.stringify(res) + '\r\n\r\n', (err) =>  {
                            if (err) throw err;
                        });    
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

            let _renewOrders = async function(){
                await renewOrders();
            }
            if(NODE_ENV == 'production'){
                setInterval(_renewOrders,INTERVAL);
            } else { //dev
                setInterval(_renewOrders,INTERVAL);
            }
        });    
    }
});

/**
 * 处理订单信息
 * @param {Array} apiOrders 
 */
async function onOrderMessage(res){
    let apiOrders = res.data;
    let site = res.site;

    /**
     * apiOrder数据结构
        outerId: apiOrder.order_id,
        symbol: this._getPositionSymbol(apiOrder.contract_name),
        type: "LIMIT", //“LIMIT”, “MARKET”, “STOP”, “TRAILING_STOP”, “EXCHANGE_MARKET”, “EXCHANGE_LIMIT”, “EXCHANGE_STOP”, “EXCHANGE_TRAILING_STOP”, “FOK”, “EXCHANGE_FOK”
        status: status,//status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                        //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                        //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败

        amount: amount, //已委托数量
        dealAmount: dealAmount, //已成交数量
        side: side,

        created: +apiOrder.created_date,
        price: apiOrder.price, //委托价格
        avgPrice: apiOrder.price_avg, //成交的平均价格
        hidden: false,
        unit: `${apiOrder.unit_amount}_usd`,
        maker: apiOrder.maker
     */
    try{
        for(let apiOrder of apiOrders){
            apiOrder.site = site;
            let order = await Order.findOne({ outerId: apiOrder.outerId,site: site });
            if(!order){
                continue;
            }

            let realDealAmount = orderLib.getRealAmount(apiOrder.dealAmount,apiOrder.avgPrice || apiOrder.price,apiOrder.symbol,apiOrder.unit);
            let stepAmount = new Decimal(realDealAmount).minus(order.bargainAmount).toNumber(); //更改帐户的金额
            let refreshOrderRes = await orderLib.refreshOrder(order, apiOrder);
            if(refreshOrderRes.expired){
                continue;
            }

            let newOrder = refreshOrderRes.order;
            if(NODE_ENV != 'production'){
                newOrder.changeLogs.push(res.orgData);
                newOrder = await newOrder.save();
                // console.log(`\n order ${newOrder._id.toString()} changeLogs:`);
                // console.log(JSON.stringify(newOrder.changeLogs));
            }

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

async function renewOrders(){
    let now = new Date();
    let modifiedStart = new Date();
    modifiedStart.setTime(+now - 4 * 60 * 60 * 1000); //超过4个小时的就不处理了
    let modifiedEnd = new Date();
    modifiedEnd.setTime(+now - 30 * 1000); //超过30s还未成交的就修改价格

    let order = await Order.findOneAndUpdate({ 
        reason: "transfer",
        isSysAuto: true,
        autoRetry: true,
        modified: { $lt: modifiedEnd },
        modified: { $gt: modifiedStart},
        autoRetryFailed: { $lt: 2 },
        status: { $in: ['consign','part_success'] },   //,'auto_retry'
        "$where": function(){
            return Math.abs(this.bargainAmount) < Math.abs(this.consignAmount)
        } 
    },{
        $set: { status: 'wait_retry' }
    }, {
        new: true
    });
    if(!order) return;
    
    // 如果订单只有小额没成交，有时候重新下单会失败，这里检验一个订单金额是否超过10usd
    // 考虑到系统不完善，如果因为获取不到价格信息，而导致检验失败时，默认为可以重新下单
    // TODO 系统完善后再切换成严格检查模式
    const strictMode = false;
    let canRetryRes = await canOrderRetry(order);
    if(!canRetryRes.isSuccess){
        if(strictMode){
            console.log(`处理未成交的订单时失败！返回信息：${canRetryRes.message}`);
            order.exceptions.push({
                name: 'retry',    //名称。如"retry",重试； “cancel”，撤销；“consign”，委托
                alias: '在计算是否能重试时，发生错误',   //别名。如"冻结帐户金额"
                message: canRetryRes.message,
                Manual: true, //是否需要人工处理
                status: order.status, //status可能的值:wait,准备开始；success,已完成;failed,失败
                timestamp: + new Date() //时间戳
            });

            order.status = 'consign';
            await order.save();
            return; 
        } else {
            console.log(`警告：${canRetryRes.message}`);
        }
    }

    if(canRetryRes.retry || (!strictMode && !canRetryRes.isSuccess)){
        await updateOrderPrice(order);
    } else {
        await cancelPlanOrder(order);
    }

    await Order.findOneAndUpdate({ 
        _id: order._id,
        status: 'wait_retry' 
    },{
        $set: { status: 'consign' }
    }, {
        new: true
    });
}

async function cancelPlanOrder(order){
    let cancelRes = await orderLib.cancelOrder(order);
    if(cancelRes.isSuccess){
        let strategyPlanLog = await StrategyPlanLog.findById(order.strategyPlanLogId);
        let strategyLog = await TransferStrategyLog.findById(order.actionId);
        if(strategyPlanLog && strategyLog){
            let planStrategyItem = strategyPlanLog.strategys.find(p => p.strategyId.toString() == strategyLog.strategyId.toString());
            if(planStrategyItem){
                planStrategyItem.consignAmount = new Decimal(planStrategyItem.consignAmount).minus(order.consignAmount).plus(order.bargainAmount).toNumber();
            }
    
            let operateLog = strategyLog.operates.find(p => p.orgOperate.id == order.operateId);
            if(operateLog){
                operateLog.consignAmount = new Decimal(operateLog.consignAmount).minus(order.consignAmount).plus(order.bargainAmount).toNumber();
            }
    
            await strategyPlanLog.save();
            await strategyLog.save();
        }
    }
    
    order.desc = '因策略不再满足条件而被取消';
    await order.save();
}

async function updateOrderPrice(order,options = {}){
    let normalStrategyRunner = new NormalStrategyRunner();
    if(order.actionId){
        let strategyLog = await TransferStrategyLog.findById(order.actionId);
        if(strategyLog){
            let strategy = await TransferStrategy.findById(strategyLog.strategyId);

            //如果条件不再满足，则取消订单
            let condition = '1==0';
            if(strategy.conditions){
                condition =  strategy.conditions.join(' && ');
            }

            let conditionResult = await normalStrategyRunner.getConditionResult(condition,{ 
                env:  { userName: order.userName } 
            });
            let conditionOrders = conditionResult.orders;
            if(!conditionOrders || conditionOrders.length == 0){
                await cancelPlanOrder(order);
                return;
            }
        }
    }

    try {
        let defaultOptions = {
            minStepsCount: 3,
            ignoreAmount: order.consignAmount - order.bargainAmount,
            maxLossPercent: 5
        };
        Object.assign(options,defaultOptions,options);  

        let res = await orderLib.updateOrderPrice(order,options);
        return res;
    } catch (err){
        order.exceptions.push({
            name: 'retry',    //名称。如"retry",重试； “cancel”，撤销；“consign”，委托
            alias: '修改交易价格时发生错误',   //别名。如"冻结帐户金额"
            message: err.message,
            Manual: true, //是否需要人工处理
            status: 'wait', //status可能的值:wait,准备开始；success,已完成;failed,失败
            timestamp: + new Date() //时间戳
        });

        order.autoRetryFailed++;
        await order.save();
        
        console.error(err);
        return { isSuccess: false, message: "服务器端错误"}
    }
}

async function canOrderRetry(order){
    let symbolParts = symbolUtil.getSymbolParts(order.symbol,order.site);

    /**
     * 如果订单只有小额没成交，有时候重新下单会失败，这里检验一个订单金额是否超过10usd
     */
    let coinPrice,getSymbolPriceRes;
    if(symbolParts.targetCoin != 'btc'){
        //考虑到交易网站都支持用btc兑换所有其他的币种，这里都将其他币种折算成btc。一旦条件不成立，这里的计算方式也必须要修改
        let targetSymbol = symbolUtil.getSymbolByParts({targetCoin: symbolParts.targetCoin,settlementCoin: 'btc' });
        getSymbolPriceRes = await realPriceLib.getSymbolPrice(order.site,targetSymbol);
        if(!getSymbolPriceRes.isSuccess){
            return getSymbolPriceRes;
        }
        coinPrice = getSymbolPriceRes.price;
    } else {
        coinPrice = 1;
    }

    let btcSymbol = 'btc#usd';
    getSymbolPriceRes = await realPriceLib.getSymbolPrice('bitfinex',btcSymbol);
    if(!getSymbolPriceRes.isSuccess){
        return getSymbolPriceRes;
    }
    let btcPrice = getSymbolPriceRes.price;

    let usdValue = coinPrice * btcPrice * Math.abs(order.amount);
    return { isSuccess: true, retry: usdValue > 10 };
}
