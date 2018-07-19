'use strict';
const assetLib = require('../../lib/asset');

module.exports = function (router) {
    router.get('/', async function(req, res) {
        if(!req.user.userName){
            return res.json({ isSuccess: false, code: 401, message: "未登录"});
        }

        try{
            let site = req.query['site'];
            let assetInfo = await assetLib.getTotalAsset(site);
            res.render('admin/wallets',{ 
                assetInfo: JSON.stringify(assetInfo)
            });
        } catch (err){
            console.error(err);
            res.redirect('/500.html')
        }
    })
}