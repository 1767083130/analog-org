'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const TransferStrategy = mongoose.model('TransferStrategy');
const StrategyPlan = mongoose.model('StrategyPlan');

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

    router.post('/updatePlanStatus', async function(req, res) {    
        try{    
            let userName = req.user.userName;
            let sPlanId = req.body.planId;
            let status = req.body.status;
            if(['init','wait', 'running', 'success', 'stopped'].indexOf(status) == -1){
                return res.json({ isSuccess: false,message: "status的值只能为init、wait、running、success或stopped" });
            }

            let planId = mongoose.Types.ObjectId(sPlanId);
            let plan = await StrategyPlan.findOneAndUpdate({ 
                userName: userName, 
                _id: planId
            },{ 
                status: status, 
                modified: new Date()
            },{ 
                upsert: false,
                new: true
            }).exec();
            return { isSuccess: !!plan, plan: plan };

        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.get('/getPlanStrategys', async function(req, res) {
        try{
            let userName = req.user.userName;
            let env = { userName: userName };
            let envOptions = { env: env };

            let sPlanId = req.body.planId;
            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }
            let strategys = await TransferStrategy.find({ userName: userName,planId: planId,isValid: true });
            res.json({ isSuccess: true, strategys: strategys });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.get('/getConditionResult', async function(req, res) {
        try{
            let userName = req.user.userName;
            let env = { userName: userName };
            let envOptions = { env: env };
            let strategyType = req.query.strategyType || 'normal';
            let condition = req.query.condition || '1==0';

            let runRes = await transferController.getConditionResult(condition,strategyType,envOptions);
            res.json({ isSuccess: true, conditionResult: runRes });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/setStrategy', async function (req, res) {
        try{
            let userName = req.user.userName;
            let _transferStrategy = JSON.parse(req.body.strategy);
            let sPlanId = req.body.planId;

            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }
            let plan= await StrategyPlan.findOne({_id: planId, userName: userName });
            if(!plan){
                return res.json({ isSuccess: false,message: "修改的任务不存在，有可能已被删除" });
            }

            let transferStrategy;
            if(_transferStrategy._id){
                let strategyId;
                if(_transferStrategy._id){
                    strategyId = mongoose.Types.ObjectId(_transferStrategy._id);
                }
                transferStrategy= await TransferStrategy.findOne({_id: strategyId, userName: userName });
                if(!transferStrategy){
                    return res.json({ isSuccess: false,message: "修改的策略不存在，有可能已被删除" });
                }

                for(let key in _transferStrategy){
                    transferStrategy[key] = _transferStrategy[key];
                }
            } else {
                transferStrategy = new TransferStrategy(_transferStrategy);
            }

            transferStrategy.planId = plan._id;
            transferStrategy.userName = req.user.userName;
            transferStrategy = await transferStrategy.save();

            plan.strategys.push({
                strategyId: transferStrategy._id,
                consignAmount: 0,
                actualAmount: 0
            });
            plan = await plan.save();

            res.json({ isSuccess: true,  strategy: transferStrategy });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/removeStrategy', async function (req, res) {
        try{
            let userName = req.user.userName;
            
            let sPlanId = req.body.planId;
            let planId = mongoose.Types.ObjectId(sPlanId);
            let plan= await StrategyPlan.findOne({_id: planId, userName: userName });
            if(!plan){
                return res.json({ isSuccess: false,message: "修改的任务不存在，有可能已被删除" });
            }

            let sStrategyId = req.body.strategyId;
            let strategyId = mongoose.Types.ObjectId(sStrategyId);
            let transferStrategy = await TransferStrategy.findOne({_id: strategyId, userName: userName });
        
            transferStrategy.isValid = false;
            transferStrategy = await transferStrategy.save();

            let removedIndex = plan.strategys.findIndex(p => p.strategyId.toString() == strategyId.toString());
            if(removedIndex != -1){
                plan.strategys.splice(removedIndex,1)
                plan = await plan.save();
            }

            res.json({ isSuccess: true,  plan: plan });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
    
    router.post('/save', async function (req, res) {
        try{
            let userName = req.user.userName;
            let _plan = req.body.plan;

            let plan;
            if(_plan._id){
                let planId;
                if(_plan._id){
                    planId = mongoose.Types.ObjectId(_plan._id);
                }
                plan= await StrategyPlan.findOne({_id: planId, userName: userName });
                if(!plan){
                    return res.json({ isSuccess: false,message: "修改的任务不存在，有可能已被删除" });
                }

                for(let key in _plan){
                    plan[key] = _plan[key];
                }
            } else {
                plan = new StrategyPlan(_plan);
            }

            plan.userName = req.user.userName;
            plan = await plan.save();
            res.json({ isSuccess: !!plan, plan: plan });

        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/delete', async function(req, res) {
        try{
            let sPlanId = req.body.planId;
            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }
    
            let userName = req.user.userName;
            let plan = await StrategyPlan.findOneAndUpdate({ 
                    userName: userName, 
                    _id: planId
                },{ 
                    isValid: false, 
                    modified: new Date()
                },{ 
                    upsert: false,
                    new: true
                }).exec();
            res.json({ isSuccess: !!plan, plan: plan });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/run', async function(req, res) {
        try{
            let sPlanId = req.body.planId;
            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }
    
            let userName = req.user.userName;
            let plan = await StrategyPlan.findOneAndUpdate({ 
                    userName: userName, 
                    _id: planId
                },{ 
                    status: 'wait', 
                    modified: new Date()
                },{ 
                    upsert: false,
                    new: true
                }).exec();
            res.json({ isSuccess: !!plan, plan: plan });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/reset', async function(req, res) {
        try{
            let sPlanId = req.body.planId;
            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }
    
            let strategyPlan = await StrategyPlan.findOne({ userName: req.user.userName, _id: planId});
            if(!strategyPlan){
                return res.json({ isSuccess: false,message: "找不到运行的任务" });
            } 

            strategyPlan.status = 'init';
            for(let strategy of strategyPlan.strategys){
                strategy.consignAmount = 0;
                strategy.actualAmount = 0;
            }
           
            strategyPlan = await strategyPlan.save();
            res.json({ isSuccess: !!strategyPlan,plan: strategyPlan });
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
            let plans = getRes.docs;
            for(let plan of plans){
                let strategyIds = [],
                    consignAmounts = [0],
                    actualAmounts = [0];
                plan.strategys = plan.strategys || [];
                for(let strategy of plan.strategys){
                    consignAmounts.push(Math.abs(strategy.consignAmount));
                    actualAmounts.push(Math.abs(strategy.actualAmount));
                    strategyIds.push(strategy.strategyId);
                }

                plan.stepConsignAmount = Math.min.apply(null,consignAmounts);
                plan.stepActualAmount = Math.min.apply(null,actualAmounts);
                plan.totalConsignAmount = Math.max.apply(null,consignAmounts);
                plan.totalActualAmount = Math.max.apply(null,actualAmounts);

                let strategys = await TransferStrategy.find({ userName : userName, _id: { $in: strategyIds } });
                plan.strategys = strategys;
            }

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