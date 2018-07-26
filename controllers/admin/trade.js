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
}

function list(req,res,callback){
    let pageNumber = Number(req.body.page || '1') || 1;
    let pageSize = Number(req.body.rp || '10') || 10;

    let userName = req.user.userName;
    
    //设置查询条件变量
    let params = { } ;
    let showType = req.query.type || req.body.type;
    if( showType == 1 ){  //显示策略计划没用完成的委托
        let modifiedStart = new Date(+new Date() - 30 * 60 * 1000); //30 minutes 之前的数据
        let planLogId = req.query.planLogId;
        params = {
            userName: userName,
            isSysAuto: true,
            strategyPlanLogId: mongoose.Types.ObjectId(planLogId), //策略计划id
            modified: { $gt: modifiedStart},    //大于半小时之后
            status: { $in: ['wait','consign','part_success','will_cancel','wait_retry'] }  //,'auto_retry'
        };
    }else if( showType == 2 ){
        let planLogId = req.query.planLogId || req.body.planLogId;
        params = {
            strategyPlanLogId:mongoose.Types.ObjectId(planLogId)    //策略计划id
        };
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
        params.created =  createdStart ;
    } else if(createdEnd){
        params.created =  createdEnd ;
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

