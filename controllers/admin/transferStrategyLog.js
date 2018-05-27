'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const async = require('co').wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const transfer = require('../../lib/transfer');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    router.get('/', async(function* (req, res) {
        try{
            list(req,res,function(result){
                res.render('transferStrategyLog', result);
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.post('/list', async(function* (req, res) {
        try{
            list(req,res,function(result){
                res.json(result);
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.post('/runTransferStep', async(function* (req, res) {     
        try{   
            let userName = req.user.userName;
            let sTransferId = req.param('transferId');
            let status = req.param('status');
            let transferId = mongoose.Types.ObjectId(sTransferId);

            res.json({ isSuccess: true });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.post('/finishTransferStep', async function(req, res) {
        try{
            let sStrategyStepId = req.body.strategyStepId;
            let strategyStepId;
            if(sStrategyStepId){
                strategyStepId = mongoose.Types.ObjectId(sStrategyStepId);
            }

            let stepLog = await TransferStrategyLog.aggregate(
                //{ $match: { "operates._id" : strategyStepId } },
                { $unwind:"$operates" },
                { $match: { "operates._id": strategyStepId } },
                { $group: { 
                    userName: "$userName", 
                    strategyId: "$strategyId", 
                    operate: { $first: "$operates" } }
                }
            ).exec();

            if(!stepLog){
                return res.json({ isSuccess: false,errorCode:"200000", message: "找不到执行记录!" });
            }
            
            await transferController.finishTransferStep(stepLog.operate);
            res.json({ isSuccess: true });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

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
    let sPageIndex = req.body.pageIndex;
    let sPageSize = req.body.pageSize;
    let sAuto = req.body.auto;
    let sStatus = req.body.status;

    let pageIndex = Number(sPageIndex) || 0;
    let pageSize = Number(sPageSize) || 10;

    let userName = req.user.userName;
    let query = { "$where": function(){
        return true;
    }};


    var options = {
        //select:   'title date author',
        sort: { modified : -1 },
        //populate: 'strategyId',
        lean: true,
        page: pageIndex + 1, 
        limit: pageSize
    };

    TransferStrategyLog.paginate(query, options).then(function(getRes) {
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            logs: getRes.docs,
            isSuccess: true
        };  

        callback(t);
    });
}