'use strict';

const mongoose = require('mongoose');
const TransferStrategy = mongoose.model('TransferStrategy');
const StrategyPlan = mongoose.model('StrategyPlan');
const StrategyPlanLog = mongoose.model('StrategyPlanLog');
const Decimal = require('decimal.js');
const strategy = require('../../lib/strategy');
const strategyPlanLib = require('../../lib/strategyPlan');
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
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

            let planId = mongoose.Types.ObjectId(sPlanId);
            let plan = await StrategyPlan.findOneAndUpdate({ 
                userName: userName, 
                _id: planId
            },{ 
                status: status
            },{ 
                upsert: false,
                new: true
            }).exec();
            await strategyPlanLib.refreshStrategyPlanLog(plan);

            res.json({ isSuccess: !!plan, plan: plan });
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
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

            let sPlanId = req.query.planId;
            if(!sPlanId){
                return  res.json({ isSuccess: true, strategys: [] });
            }

            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }

            let strategysId = [];
            let strategyPlan = await StrategyPlan.findById(planId);
            if(!strategyPlan){
                return  res.json({ isSuccess: false, message: "计划已被删除！" });
            }
            strategyPlan.strategys.forEach(element => {
                strategysId.push(element.strategyId);
            });
            let planStrategys = await TransferStrategy.find({ _id: {$in: strategysId},isValid: true }).sort({created: 1});
            res.json({ isSuccess: true, strategys: planStrategys });
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
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

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
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

            let planId;
            if(sPlanId){
                planId = mongoose.Types.ObjectId(sPlanId);
            }
            let plan= await StrategyPlan.findOne({_id: planId, userName: userName });
            if(!plan){
                return res.json({ isSuccess: false,message: "修改的任务不存在，有可能已被删除" });
            }

            let transferStrategy,isNew = (!_transferStrategy._id);
            if(_transferStrategy._id){
                let strategyId;
                if(_transferStrategy._id){
                    strategyId = mongoose.Types.ObjectId(_transferStrategy._id);
                }
                transferStrategy = await TransferStrategy.findOne({_id: strategyId, userName: userName });
                if(!transferStrategy){
                    return res.json({ isSuccess: false,message: "修改的策略不存在，有可能已被删除" });
                }

                for(let key in _transferStrategy){
                    transferStrategy[key] = _transferStrategy[key];
                }
            } else {
                delete _transferStrategy._id;
                transferStrategy = new TransferStrategy(_transferStrategy);
            }

            if(transferStrategy.relatedStrategy){
                //检测是否重复设置平仓策略
                let relatedStrategy = await TransferStrategy.findOne({ _id: transferStrategy.relatedStrategy });
                if(isNew){
                    if(relatedStrategy.relatedStrategy){
                        return res.json({ isSuccess: false, code: 500, message: "已经为此策略设置了平仓策略，不能重复设置"});
                    }
                } else {
                    if(relatedStrategy.relatedStrategy.toString() != transferStrategy._id.toString()){
                        return res.json({ isSuccess: false, code: 500, message: "已经为此策略设置了平仓策略，不能重复设置"});
                    }
                }
            }

            transferStrategy.planLogId = plan.currentLog;
            transferStrategy.userName = req.user.userName;
            transferStrategy = await transferStrategy.save();

            if(isNew){
                plan.strategys.push({
                    strategyId: transferStrategy._id,
                    consignAmount: 0,
                    actualAmount: 0
                });

                if(transferStrategy.relatedStrategy){
                    let relatedStrategy = await TransferStrategy.findOne({_id: transferStrategy.relatedStrategy, userName: userName });
                    if(relatedStrategy){
                        relatedStrategy.relatedStrategy = transferStrategy._id;
                        relatedStrategy.direction = (_transferStrategy.direction == 1 ? 2 : 1);
                    }
                    await relatedStrategy.save();
                }
            }
            plan = await plan.save();
            await strategyPlanLib.refreshStrategyPlanLog(plan);

            res.json({ isSuccess: true,  strategy: transferStrategy });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/removeStrategy', async function (req, res) {
        try{
            let userName = req.user.userName;
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }
            
            let sPlanId = req.body.planId;
            let planId = mongoose.Types.ObjectId(sPlanId);
            let plan= await StrategyPlan.findOne({_id: planId, userName: userName });
            if(!plan){
                return res.json({ isSuccess: false,message: "修改的任务不存在，有可能已被删除" });
            }

            let sStrategyId = req.body.strategyId;
            let strategyId = mongoose.Types.ObjectId(sStrategyId);
            let transferStrategy = await TransferStrategy.findOne({_id: strategyId, userName: userName });
            if(transferStrategy.relatedStrategy){
                if(transferStrategy.direction == 1){
                    //await TransferStrategy.remove({_id: transferStrategy.relatedStrategy, userName: userName });
                    let removedIndex = plan.strategys.findIndex(p => p.strategyId.toString() == transferStrategy.relatedStrategy.toString());
                    if(removedIndex != -1){
                        plan.strategys.splice(removedIndex,1)
                        plan = await plan.save();
                    }
                } else {
                    await TransferStrategy.findOneAndUpdate({
                        _id: transferStrategy.relatedStrategy, 
                        userName: userName 
                    },{
                        $unset: { "relatedStrategy": true, "direction": true }
                    });
                }
            } 

            //await TransferStrategy.remove({_id: strategyId, userName: userName });
            let removedIndex = plan.strategys.findIndex(p => p.strategyId.toString() == strategyId.toString());
            if(removedIndex != -1){
                plan.strategys.splice(removedIndex,1)
                plan = await plan.save();
            }
            await strategyPlanLib.refreshStrategyPlanLog(plan);

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
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

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
                delete _plan._id;
                plan = new StrategyPlan(_plan);
            }

            plan.userName = req.user.userName;
            plan = await plan.save();
            await strategyPlanLib.refreshStrategyPlanLog(plan,true);

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
            if(!userName){
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

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
            await strategyPlanLib.refreshStrategyPlanLog(plan);
            
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
                    status: 'wait'
                },{ 
                    upsert: false,
                    new: true
                }).exec();
            await strategyPlanLib.refreshStrategyPlanLog(plan);
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

            let status = req.body.status || 'wait';  
            let strategyPlan = await StrategyPlan.findOne({ userName: req.user.userName, _id: planId});
            if(!strategyPlan){
                return res.json({ isSuccess: false,message: "找不到运行的任务" });
            } 

            let newPlan = strategyPlanLib.resetStrategyPlan(strategyPlan,status);
            res.json({ isSuccess: !!newPlan,plan: newPlan });
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
            //select:'title date author',
            sort: { modified : -1 },
            //populate:'strategyId',
            lean: true,
            page: pageIndex + 1, 
            limit: pageSize
        };

        let business = configUtil.getBusiness();
        business.sites = apiConfigUtil.getSites();
        business.symbols = apiConfigUtil.getSiteSymbols();

        StrategyPlan.paginate(filters, options).then(async function(getRes) {
            let planIds = [],plans = getRes.docs;
            plans.forEach(p => planIds.push(p._id));
            let planLogs = await StrategyPlanLog.find({ planId: {$in: planIds } });

            for(let plan of plans){
                let strategyIds = [];
                let planLog =  planLogs.find(p => p._id.toString() == plan.currentLog.toString());
                if(!planLog){
                    continue;
                }

                planLog.strategys.forEach(element => {
                    strategyIds.push(element.strategyId);
                });

                let planRunLogInfo = await strategyPlanLib.getStrategyPlanLogRunInfo(planLog);
                Object.assign(plan,plan,{
                    totalConsignAmount: 0,  //任务已委托数量
                    totalActualAmount: 0    //任务已成交数量
                },planRunLogInfo);

                let strategys = await TransferStrategy.find({ userName : userName, _id: { $in: strategyIds } });
                plan.strategys = strategys;
                if(strategys.length > 0 && strategys[0].conditions.length == 1){
                    let expressionValue = await strategy.getExpressionValue(strategys[0].conditions[0],strategys[0].strategyType);
                    plan.strategyValue = new Decimal(expressionValue * 100).toFixed(2) + '%';
                }
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