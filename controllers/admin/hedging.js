'use strict';

const mongoose = require('mongoose');
const TransferStrategy = mongoose.model('TransferStrategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const async = require('co').wrap;
const only = require('only');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    //router.get('/', account.index_api);
    router.post('/strategysList', async(function* (req, res) {
        try{
            list(req,res,function(data){
                res.json(data);     
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));

    router.post('/saveAccountStrategy', async function (req, res) {
        try{
            let strategy = await TransferStrategy.findOne({ userName: req.user.userName });
            if(!strategy){
                strategy = new TransferStrategy();
            }
            
            //todo
            strategy.userName = req.user.userName;
            strategy.account = req.body.accountStrategy;
            strategy = await strategy.save();

            res.json({ isSuccess: true,strategy: strategy });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
};

function list(req,res,callback){
    let sPageIndex = req.param('pageIndex');
    let sPageSize = req.param('pageSize');
    let pageIndex = Number(sPageIndex) || 0;
    let pageSize = Number(sPageSize) || 10;
    let userName = req.user.userName;

    let filters = { userName : userName}
    
    var options = {
        //select:   'title date author',
        sort: { modified : -1 },
        //populate: 'strategyId',
        lean: true,
        page: pageIndex + 1, 
        limit: pageSize
    };

    TransferStrategy.paginate(filters, options).then(function(getRes) {
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            logs: getRes.docs,
            isSuccess: true
        };  

        callback(t);
    });
}


