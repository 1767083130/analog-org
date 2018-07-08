'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const TransferStrategy = mongoose.model('TransferStrategy');
const StrategyPlan = mongoose.model('StrategyPlan');
const Decimal = require('decimal.js');

const co = require('co');
const async = co.wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const transfer = require('../../lib/transfer');
const strategy = require('../../lib/strategy');
const configUtil = require('../../lib/utils/configUtil');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    router.get('/', async function(req, res) {
        try{
            list(req,res,function(data){
                res.render('admin/plan', data);
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.get('/list', async function(req, res) {
        try{
            list(req,res,function(data){
                res.json(data);   
            });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
}


function list(req,res,callback){
    try{
        let sPageIndex = req.query.pageIndex;
        let sPageSize = req.query.pageSize;
        let pageIndex = Number(sPageIndex) || 0;
        let pageSize = Number(sPageSize) || 20;
        let userName = req.user.userName;
        if(!userName){
            return  res.json({ isSuccess: false,message: "尚未登录" });
        }

        let filters = { userName : userName, isValid: true,isSimple: true };
        let run = req.query.run;
        if(run === undefined){
            run = true;
        }
        
        var options = {
            //select:   'title date author',
            sort: { modified : -1 },
            //populate: 'strategyId',
            lean: true,
            page: pageIndex + 1, 
            limit: pageSize
        };

        let business = configUtil.getBusiness();
        business.sites = apiConfigUtil.getSites();
        business.symbols = apiConfigUtil.getSiteSymbols();

        StrategyPlan.paginate(filters, options).then(async function(getRes) {
            let t = {
                pageSize: getRes.limit,
                total: getRes.total,
                plans: JSON.stringify(plans),
                business: JSON.stringify(business),
                isSuccess: true
            };  

            callback(t);
        });
    } catch(err){
        console.error(err);
        res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
    }
}