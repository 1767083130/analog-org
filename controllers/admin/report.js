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
                res.render('admin/report',result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));
 
    router.get('/list', async(function* (req,res){
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

    let userName = req.user.userName;
    
    //设置查询条件变量
    let params = { } ;


    let site = req.query.site || req.body.site;
    site && (params.site = site);

    let symbol = req.query.symbol || req.body.symbol;
    symbol && (params.symbol = symbol);

    let status = req.query.status || req.body.status;
    status && (params.status = status);

    let createdStart = req.query.createdStart || req.body.createdStart;
    let createdEnd = req.query.createdEnd || req.body.createdEnd;

    var s = new Date(+new Date() - 24 * 60 * 60 * 1000 * 15); //至多只能查询15天之内的数据
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

    //获取成交总量\平均价
    let bargainAmountSum = await Order.aggregate([
        {
            $match: params 
        },
        { 
            $group: { 
                _id: { site:"$site",side:"$side",symbol:"$symbol" }, 
                bargainAmount: { $sum: "$bargainAmount" },
                total: { $sum:{ $multiply:["$bargainAmount","$avgPrice"] }},    //total总价
                sum: { $sum: "$bargainAmount" }     //sum总量
            }
        }
    ]);

    params.userName = userName;
   

    let business = configUtil.getBusiness();
    business.sites = apiConfigUtil.getSites();
    business.symbols = apiConfigUtil.getSiteSymbols();

    Order.paginate(params).then(async function(getRes) {
        
        let t = {
            business:JSON.stringify(business || []),
            bargainAmountSum:JSON.stringify(bargainAmountSum || []),
            isSuccess: true
        };  

        callback(t);
    });
}
