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
const order = require('../../lib/order');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    //router.get('/', account.index_api);

    router.get('/', async(function* (req, res) {
        try{
            list(req,res,function(data){
                res.render('admin/trade-1',data);
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.get('/list', async(function* (req, res) {
        try{
            list(req,res,function(data){
                res.json(data);     
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

function list(req,res,callback){
    let sPageIndex = req.query.pageIndex;
    let sPageSize = req.query.pageSize;
    let pageIndex = Number(sPageIndex) || 0;
    let pageSize = Number(sPageSize) || 10;

    let userName = req.user.userName;
    let status = req.query.status;
    let site = req.query.site;

    if(!userName){
        callback({ isSuccess: false,code: "100007",message: "用户尚未登录" });
        return;
    }

    let filters = { userName : userName }
    if(status){
        filters.status = status;
    }

    if(site){
        filters.site = site;
    }

    var options = {
        //select:   'title date author',
        sort: { modified : -1 },
        //populate: 'strategyId',
        lean: true,
        page: pageIndex + 1, 
        limit: pageSize
    };

    Order.paginate(filters, options).then(function(getRes) {
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            orders: getRes.docs,
            isSuccess: true
        };  

        callback(t);
    });
}