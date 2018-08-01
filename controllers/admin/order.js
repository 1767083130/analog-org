'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const Order = mongoose.model('Order');

const co = require('co');
const async = require('co').wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const transfer = require('../../lib/transfer');
const orderLib = require('../../lib/order');
const realTimePrice = require('../../lib/realTimePrice');
const clientIdentifierLib = require('../../lib/clientIdentifier');
const configUtil = require('../../lib/utils/configUtil');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    router.get('/',async(function * (req,res){
        try{
            list(req,res,function(result){
                res.render('admin/order',result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.post('/list', async(function* (req,res){
        try{
            list(req,res,function(result){
                res.json(result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        } 
    }));

    
    router.post('/createOrder', async(function* (req,res){
        try{
            createOrder(req,res,function(result){
                res.json(result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        } 
    }));
}

async function list(req,res,callback){
    let pageNumber = Number(req.body.page || '1') || 1;
    let pageSize = Number(req.body.rp || '10') || 10;

    let userName = req.user.userName;
    if(!userName){
        return { isSuccess: false, code: 401, message: "用户未登录" }
    }

    let showAll = ((req.query.showAll || req.body.showAll || 1) == 1 ? true : false);
    
    //设置查询条件变量
    let params = {
        reason: 'normal',
        isSysAuto: true
    };
    
    if(!showAll){
        // params.$not = { $or: [ 
        //     { status: 'auto_retry', bargainAmount: 0 },
        //     { status: 'canceled', bargainAmount: 0 }
        // ]};
        //这里使用$where效率是个问题 //TODO
        params.$where = function() { 
            if(this.status == 'auto_retry' || this.status == 'canceled'){
                return this.bargainAmount != 0;
            }
            return true;
        }
    }

    //通过页面刷新fexligrid插件,setNewExtParam获取来的值
    let symbol = req.query.symbol || req.body.symbol;
    symbol && (params.symbol = symbol);

    let site = req.query.site || req.body.site;
    site && (params.site = site);

    let status = req.query.status || req.body.status;
    status && (params.status = status);

    let threeMonthsAgo = new Date(+new Date() - 3 * 30 * 24 * 60 * 60 * 1000); //90天以内
    let createdStart = req.query.createdStart || req.body.createdStart || threeMonthsAgo;
    let createdEnd = req.query.createdEnd || req.body.createdEnd;
    createdStart = Math.max(threeMonthsAgo,createdStart);
    
    if(createdStart && createdEnd){
        params.created = {"$gte" : createdStart, "$lt" : createdEnd};  //ISODate
    } else if(createdStart){
        params.created = {"$gte" : createdStart };
    } else if(createdEnd){
        params.created = {"$lt" : createdEnd };
    }

    params.userName = userName;
    var options = {
        //select:   'title date author',
        sort: { created : -1 },
        //populate: 'strategyId',
        lean: true,
        page: pageNumber, 
        limit: pageSize
    };

    let business = configUtil.getBusiness();
    business.sites = apiConfigUtil.getSites();
    business.symbols = apiConfigUtil.getSiteSymbols();

    Order.paginate(params, options).then(async function(getRes) {
        let orders = getRes.docs || [];
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            orders: JSON.stringify(orders || []),
            business:JSON.stringify(business || []),
            isSuccess: true
        };  

        callback(t);
    });
}

async function createOrder(req,res,callback){
    let userName = req.user.userName;
    if(!userName){
        return { isSuccess: false, code: 401, message: "用户未登录" }
    }

    //这里需要检查传过来值的合理性 //TODO
    let options = req.body.options;
    let price = options.price;
    let operateType = options.operate; 
    options.isPostOnly = (options.isPostOnly == 1 ? true : false);
    options.isMarketPrice  = (options.isMarketPrice == 1 ? true : false);
    
    if(options.isPostOnly || options.isMarketPrice){
        let getDepthsRes = realTimePrice.getSymbolDepths(options.site,options.symbol);
        if(!getDepthsRes.isSuccess){
            callback && callback(createOrderRes);
            return { isSuccess: false, message: getDepthsRes.message };
        }

        if(options.amount < 0){
            operateType = (operateType == 'buy' ? 'sell' : 'buy');
        }

        let depths = getDepthsRes.data;
        /* 根据市场深度计算促成成交的最合适的价格 */
        let ignoreOptions = {
            ignoreStepsCount: 1,
            ignoreAmount: 0,
            //maxLossPercent: options.maxLossPercent
        };
        if(options.isPostOnly){
            price = orderLib.getPostOnlyPrice(depths,operateType,ignoreOptions); 
        } 
        if(options.isMarketPrice) { //market 按市场价立即成交
            price = orderLib.getMarketPrice(depths,operateType,ignoreOptions)
        }
    }

    
    let identifier = await clientIdentifierLib.getUserClient(userName,options.site);  
    if(!identifier){
        callback && callback(createOrderRes);
        return  { isSuccess: false, errorCode: "100003", message: "client为空" };              
    }

    let side = 'buy'; //TODO 应该根据仓位自动来确定
    let amount = options.amount;
    if(operateType == 'buy'){
        amount = (side == 'buy' ? amount : -amount);
    } else if(operateType == 'sell') { 
        amount = (side == 'buy' ? -amount : amount);
    }

    let orderItem = {
        site: options.site, //平台名称
        userName: userName, 
        isTest: false,
        autoRetry: true, //TODO
        side: side, //buy或sell
        type: options.type,
        reason: "normal", //原因
        symbol: options.symbol, //cny、btc、ltc、usd
        consignDate: new Date(), //委托时间

        price: price, //委托价格
        amount: amount, //总数量

        consignAmount: amount, //已委托数量
        isPostOnly: options.isPostOnly,
        isHidden: false,

        isSysAuto: true,
        //outerId: String,  //外部交易网站的Id
        status: "wait", 

        created: new Date(), //创建时间
        modified: new Date() //最近修改时间
    };

    /**
     * 提交一个交易委托，并保存记录。 
     *
     * @param {Order} order, 交易委托 如{ site: "huobi", userName: "lcm", autoRetry: false,
     *          consignAmount: 12,price: 12, side: "buy" || "sell",reason: "调仓", symbol: 'btc' }
     * @param {ClientIdentifier} identifier,可为空
     * @returns {Object} 是否成功。如{
         { isSuccess: true, //是否成功
         actionId: newOrder._id, //委托Id
         order: newOrder } //委托交易
     */
    let createOrderRes = await orderLib.createOrder(orderItem,identifier);
    callback && callback(createOrderRes);
    return createOrderRes;  
}