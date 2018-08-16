'use strict';

const only = require('only');
const Decimal = require('decimal.js');
const position = require('../../lib/position');
const cacheClient = require('../../lib/apiClient/cacheClient').getInstance();

module.exports = function (router) {
  
    /**
     * 获取账户资产详情
     * http://localhost/api/position/getPositions
     */
    router.get('/getPositions',async function(req, res) {
        try{
            let site = req.query['site'],
                coins = req.query['coins'];
            let positionsInfo = await position.getPositions(site);
            if(!positionsInfo.isSuccess){
                res.json(positionsInfo);
            }

            if(coins){
                let items = [],arrCoins = coins.split(',');
                for(let i = 0; i < arrCoins.length; i++){
                    let coin = arrCoins[i];
                    let coinItem = positionsInfo.data.coins.find( p => p.coin == coin);
                    items.push(coinItem);
                }
                positionsInfo = {
                    "isSuccess": true,
                    "data": {
                        "coins": items
                    }
                }
            }
            res.json(positionsInfo);
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });

        /**
     * 获取账户资产详情
     * http://localhost/api/position/getCachePositions
     */
    router.get('/getCachePositions',async function(req, res) {
        try{
            let site = req.query['site'],
                symbol = req.query['symbol'];
            if(!site){
                return res.json({ isSuccess: false, message: '参数site不能为空'});
            }
            if(symbol){
                symbol = symbol.replace('/','#');
            }

            let positionItemsRes = cacheClient.getPositions(site,symbol);
            res.json(positionItemsRes);
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });
}