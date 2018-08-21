'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const pm2 = require('pm2');

module.exports = function (router) {
    router.get('/', async function(req, res) {
        try{
            list(req,res,function(result){
                res.render('admin/pm2',result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });

    router.post('/list', async function(req,res){
        try{
            list(req,res,function(result){
                res.json(result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        } 
    });

    router.post('/restart', async function(req,res){
        try{
            let userName = req.user.userName;
            if(userName != 'lcm'){ //TODO 应该判断是否为超级管理员
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

            //let pm_id = req.body.id;
            let name = req.body.name;
            pm2.connect(function(err) {
                if (err) {
                    console.error(err);
                    return res.json({ isSuccess: false });
                }

                pm2.restart(name, function(err, app) {
                    if (err) {
                        console.error(err);
                        pm2.disconnect();
                        return res.json({ isSuccess: false });
                    }
                
                    console.log('Process Restarted');
                    pm2.disconnect();
                    return res.json({ isSuccess: true });
                });
            });
         
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        } 
    });

    router.post('/stop', async function(req,res){
        try{
            let userName = req.user.userName;
            if(userName != 'lcm'){ //TODO 应该判断是否为超级管理员
                return  res.json({ isSuccess: false,message: "尚未登录" });
            }

            //let pm_id = req.body.id;
            let name = req.body.name;
            pm2.connect(function(err) {
                if (err) {
                    console.error(err);
                    return res.json({ isSuccess: false });
                }

                pm2.stop(name, function(err, app) {
                    if (err) {
                        console.error(err);
                        pm2.disconnect();
                        return res.json({ isSuccess: false });
                    }
                
                    console.log('Process Stopped');
                    pm2.disconnect();
                    return res.json({ isSuccess: true });
                });
            });
         
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        } 
    });
    

}

async function list(req,res,callback){
    let pageNumber = Number(req.body.page || '1') || 1;
    let pageSize = Number(req.body.rp || '10') || 10;

    let userName = req.user.userName;
    pm2.connect(function(err) {
        if (err) {
            console.error(err);
            return callback && callback({ isSuccess: false });
        }

        pm2.list(function(err, list) {
            if(list.length == 0){
                let i = 1;
            }

            pm2.disconnect();
            let workers = [];
            for(let i = 0; i < list.length; i++){
                let item = list[i];
                let worker = {
                    name: item.name,
                    id: item.pm_id,
                    pid: item.pid,
                    status: item.pm2_env.status,
                    restart: item.pm2_env.unstable_restarts,
                    cpu: item.monit.cpu,
                    memory: item.monit.memory 
                };
                workers.push(worker);
            }

            callback && callback({ isSuccess: true,workers: JSON.stringify(workers || []) });
        });

    });
}
