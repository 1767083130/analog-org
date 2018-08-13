'use strict';

const only = require('only');
const Decimal = require('decimal.js');
const asset = require('../../lib/asset');
const position = require('../../lib/position');

module.exports = function (router) {
  
    /**
     * 获取账户资产详情
     * http://localhost:4000/api/asset/getTotalAsset
     */
    router.get('/getTotalAsset',async function(req, res) {
        try{
            let site = req.query['site'];
            let assetInfo = await asset.getTotalAsset(site);
            let positionInfo = await position.getPositions(site);
            if(!positionInfo.isSuccess || !assetInfo.isSuccess){
                return res.json({ isSuccess: false, message: "系统发生错误" });
            } 

            res.json({ 
                isSuccess: true,
                asset: assetInfo, 
                position: positionInfo
            });
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });

    /**
     * 获取账户资产详情
     * http://localhost:4000/api/asset/getTotalAsset
     */
    router.get('/getTotalAsset',async function(req, res) {
        try{
            let site = req.query['site'];
            let assetInfo = await asset.getTotalAsset(site);
            let positionInfo = await position.getPositions(site);
            if(!positionInfo.isSuccess || !assetInfo.isSuccess){
                return res.json({ isSuccess: false, message: "系统发生错误" });
            } 

            res.json({ 
                isSuccess: true,
                asset: assetInfo, 
                position: positionInfo
            });
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });

    
    /**
     * 获取账户资产详情
     * http://localhost:4000/api/asset/getWalletInfo
     */
    router.get('/getWalletInfo',async function(req, res) {
        try{
            let site = req.query['site'];
            let walletItemsRes = cacheClient.getWalletInfo(site);
            if(!walletItemsRes.isSuccess){
                return res.json(walletItemsRes);
            } 

            res.json(walletItemsRes);
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });

    

    /**
     * 获取用户资产详情
     * http://localhost:4000/api/asset/getUserAsset
     */
    router.get('/getUserAsset',async function(req, res) {
        try{
            let userAssetInfo = await asset.getUserAsset();
            res.json(userAssetInfo);
        } catch (err){
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });
}