'use strict';
const positionLib = require('../../lib/position');

module.exports = function (router) {
    router.get('/', async function(req, res) {
        if(!req.user.userName){
            return res.json({ isSuccess: false, code: 401, message: "未登录"});
        }

        try{
            let site = req.query['site'],
                symbol = req.query['symbol'];
            let positionsInfo = await positionLib.getPositions(site,symbol);
            res.render('admin/positions', { positions: JSON.stringify(positionsInfo) });
        } catch (err){
            console.error(err);
            res.json({ isSuccess: false, message: "系统发生错误" });
        }
    });
}