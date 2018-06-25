'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const Transfer = mongoose.model('Transfer');

const async = require('co').wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const transfer = require('../../lib/transfer');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    //router.get('/', account.index_api);

    router.get('/', async(function* (req, res) {
        try{
            list(req,res,function(data){
                res.render('admin/transfer', data);
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.post('/list', async(function* (req, res) {
        try{
            list(req,res,function(data){
                res.json(data);
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    
    router.post('/updateStatus', async function(req, res) { 
        try{       
            let userName = req.user.userName;
            let sTransferId = req.param('transferId');
            let status = req.param('status');
            let transferId = mongoose.Types.ObjectId(sTransferId);


            let stepCallBack;
            await transfer.syncUserRecenttransfers(userName,sites,stepCallBack);
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
        callback({ isSuccess: false,code: "100007",message: "用户未登录" });
        return;
    }

    let filters = { userName : userName };
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

    Transfer.paginate(filters, options).then(function(getRes) {
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            logs: getRes.docs,
            isSuccess: true
        };  

        callback(t);
    });
}