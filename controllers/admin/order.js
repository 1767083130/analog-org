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

const bothApiLib = require('../../lib/apiClient/bothApi');

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

    //撤销
    router.post('/cancel', async(function* (req,res){
        try{
            cancel(req,res,function(result){
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

    let showType = req.query.type || req.body.type;
    if(showType == 1){  //显示策略计划没用完成的委托
        let modifiedStart = new Date(+new Date() - 30 * 60 * 1000); //30 minutes 之前的数据
        let planLogId = req.query.planLogId || req.body.planLogId;
        params = {
            userName: userName,
            isSysAuto: true,
            strategyPlanLogId: mongoose.Types.ObjectId(planLogId), //策略计划id
            modified: { $gt: modifiedStart},    //大于半小时之后
            status: { $in: ['wait','consign','part_success','will_cancel','wait_retry'] }  //,'auto_retry'
        };
    } else if(showType == 2){//显示策略计划当前运行实例的所有委托单
        let planLogId = req.query.planLogId || req.body.planLogId;
        params = {
            strategyPlanLogId:mongoose.Types.ObjectId(planLogId)    //策略计划id
        };
    } else if(showType == 3){ //显示异常委托单
        let modifiedStart = new Date(+new Date() - 15 * 60 * 1000); //15 minutes 之前的数据
        let planLogId = req.query.planLogId || req.body.planLogId;
        params = {
            modified: { $lt: modifiedStart}, 
            status: { $nin: ['success','canceled'] }  //,'auto_retry'
        };
        if(planLogId){
            params.strategyPlanLogId =  mongoose.Types.ObjectId(planLogId); //策略计划id
        }
        showAll = true;
    }
    
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
    let site = req.query.site || req.body.site;
    site && (params.site = site);

    let symbol = req.query.symbol || req.body.symbol;
    symbol && (params.symbol = symbol);

    let status = req.query.status || req.body.status;
    status && (params.status = status);

    //let threeMonthsAgo = new Date(+new Date() - 3 * 30 * 24 * 60 * 60 * 1000); //90天以内
    let createdStart = req.query.createdStart || req.body.createdStart;
    let createdEnd = req.query.createdEnd || req.body.createdEnd;
    // createdStart = Math.max(threeMonthsAgo,createdStart);
    var s = new Date(+new Date() - 3 * 30 * 24 * 60 * 60 * 1000); //至多只能查询15天之内的数据
    if(!createdStart || s > createdStart){
        createdStart = s;
    }
    
    if(createdStart && createdEnd){
        params.created = {"$gte" : new Date(createdStart), "$lt" : new Date(createdEnd) };  //ISODate
    } else if(createdStart){
        params.created = {"$gte" : new Date(createdStart) };
    } else if(createdEnd){
        params.created = {"$lt" : new Date(createdEnd) };
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


async function cancel(req,res,callback){
    let cancelOuterId = req.query.name || req.body.name;
    //wait:准备开始;consign:已委托,但未成交;success:已完成;
    //part_success:部分成功;will_cancel:已标记为取消,但是尚未完成;canceled:已取消;
    //auto_retry:委托超过一定时间未成交,已由系统自动以不同价格发起新的委托;failed,失败.
    //part_success:部分成功\consign:已委托,但未成交,可以取消

    let order = await Order.find({outerId:cancelOuterId});
    
        var order1;
        for(var i = 0; i<order.length; i++){
            order1 = order[i];
            if(["buy","sell"].indexOf(order1.side) == -1){
                return { isSuccess: false, errorCode: "100006",message: "参数错误。order1.side必须为buy或sell" };    
            }
            if(["part_success","consign"].indexOf(order1.status) == -1){
                return { isSuccess: false, errorCode: "100006",message: "参数错误。order1.status必须是part_success或consign方可撤销" }
            }
        }

        await Order.findOneAndUpdate({ 
            _id: order1.id
        },{
            $set: { status: 'will_cancel' }
        });
        let identifier = await clientIdentifierLib.getUserClient(order1.userName,order1.site); 
        
        let api = bothApiLib.getInstance(identifier);
        //先撤消原有委托
        let cancelOrderRes = await api.cancel({
            id: order1.outerId,
            symbol: order1.symbol
        });
        if(cancelOrderRes.isSuccess){
            await Order.findOneAndUpdate({ 
                _id: order1.id
            },{
                $set: { status: 'canceled',modified:  Date.now() }
            }, {
                new: true
            });
        }
        callback(cancelOrderRes);

}