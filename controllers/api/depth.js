'use strict';

const only = require('only');
const Decimal = require('decimal.js');
const depthLib = require('../../lib/realTimePrice');

module.exports = function (router) {
  
    /**
     * 获取账户资产详情
     * http://localhost:4000/api/depth/get
     */
    router.get('/get',async function(req, res) {
        try{
            let site = req.query.site;
            let symbol = req.query.symbol;
            if(!site){
                return res.json({ isSuccess: false, message: '参数site不能为空'});
            }
            if(!symbol){
                return res.json({ isSuccess: false, message: "参数symbol不能为空"});
            }
            symbol = symbol.replace('/','#')

            let realPrice = depthLib.getSymbolDepths(site,symbol);
            res.json(realPrice);
        } catch (err) {
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误"});
        }
    });

}