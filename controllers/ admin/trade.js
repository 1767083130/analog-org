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
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    router.get('/', async(function* (req, res) {
        try{
            list(req,res,function(result){
                res.render('admin/wtlb',result);
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

function list(req,res,callback){
    let pageNumber = Number(req.body.page || '1') || 1;
    let pageSize = Number(req.body.rp || '10') || 10;

    let userName = req.user.userName;
    
    //设置查询条件变量
    let params = { } ;

    
    if( req.query.type == 1 ){
        let modifiedStart = new Date(+new Date() - 30 * 60 * 1000); //30 minutes 之前的数据
        let planLogId = req.query.planLogId;
        params = {
            userName: userName,
            isSysAuto: true,
            strategyPlanLogId: mongoose.Types.ObjectId(planLogId), //策略id
            modified: { $gt: modifiedStart},    //大于半小时之后
            status: { $in: ['wait','consign','part_success','will_cancel','wait_retry'] }  //,'auto_retry'
        }
    }  

    params.userName = userName;
    //通过页面刷新fexligrid插件,setNewExtParam获取来的值
    //获取币种
    if(req.body.symbol){
        params.symbol = req.body.symbol;
    }
    //获取交易平台
    if(req.body.site){
        params.site = req.body.site;
    }


    var options = {
        //select:   'title date author',
        sort: { created : -1 },
        //populate: 'strategyId',
        lean: true,
        page: pageNumber, 
        limit: pageSize
    };

    Order.paginate(params, options).then(async function(getRes) {
        let orders = getRes.docs || [];
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            orders: JSON.stringify(orders || []),
            isSuccess: true
        };  

        callback(t);
    });
}
