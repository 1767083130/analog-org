'use strict';

const only = require('only');
const Decimal = require('decimal.js');
const position = require('../../lib/position');

module.exports = function (router) {
  
    /**
     * 获取账户资产详情
     * http://localhost:4000/api/position/getPositions
     */
    router.get('/getPositions',async function(req, res) {
        try{
            let site = req.query['site'],
                symbol = req.query['symbol'];
            let positionsInfo = await position.getPositions(site,symbol);
            res.json(positionsInfo);
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });
}