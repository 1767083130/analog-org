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
const order = require('../../lib/order');
const configUtil = require('../../lib/utils/configUtil');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    router.get('/', async(function* (req, res) {
        try{
            list(req,res,function(result){
                res.render('admin/trade',result);
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

    router.post('/syncRecentOrders', async function(req, res) {
        try{
            let userName = req.user.userName;
            let site = req.body.site;

            let sites = [];
            if(site == -1){
                sites = apiConfigUtil.getSites();
            } else {
                sites.push(site);
            }

            let onChanged = async function(e){
                await transferController.onOrderStatusChanged(e);
            };
            let onDelayed = async function(e){
                await transferController.onOrderDelayed(e);
            }

            order.on('change',onChanged);
            order.on('delayed',onDelayed);

            let stepCallBack;
            await order.syncUserRecentOrders(userName,sites,stepCallBack);

            order.off('change',onChanged);
            order.off('delayed',onDelayed);

            res.json({ isSuccess: true });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
}

async function list(req,res,callback){
    let pageNumber = Number(req.body.page || '1') || 1;
    let pageSize = Number(req.body.rp || '10') || 10;

    let userName = req.user.userName;
    let showAll = ((req.query.showAll || req.body.showAll) == 1 ? true : false);
    
    //设置查询条件变量
    let params = {
        reason: 'transfer',
        isSysAuto: true
    };
    let showType = req.query.type || req.body.type;
    if(showType == 1){  //显示策略计划没用完成的委托
        let modifiedStart = new Date(+new Date() - 30 * 60 * 1000); //30 minutes 之前的数据
        let planLogId = req.query.planLogId;
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
        let planLogId = req.query.planLogId;
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
    let symbol = req.query.symbol || req.body.symbol;
    symbol && (params.symbol = symbol);

    let site = req.query.site || req.body.site;
    site && (params.site = site);

    let status = req.query.status || req.body.status;
    status && (params.status = status);

    let createdStart = req.query.createdStart || req.body.createdStart;
    let createdEnd = req.query.createdEnd || req.body.createdEnd;
    if(createdStart && createdEnd){
        params.created = {"$gte" : createdStart, "$lt" : createdEnd};  //ISODate
    } else if(createdStart){
        params.created = {"$gte" : createdStart };
    } else if(createdEnd){
        params.created = {"$lt" : createdEnd };
    }

    let bargainAmountSum = await Order.aggregate([
        {
            $match: params 
        },
        { 
            $group: { 
                _id: { site:"$site",side:"$side",symbol:"$symbol" }, 
                bargainAmount: { "$sum": "$bargainAmount" }
            }
        }
    ]);

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
            bargainAmountSum:JSON.stringify(bargainAmountSum || []),
            isSuccess: true
        };  

        callback(t);
    });
}
