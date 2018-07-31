'use strict';
const trialMarketLib = require('../../lib/transferStrategys/trialMarket');

module.exports = function (router) {
    router.get('/', async function(req, res) {
        try{
            let site = req.query['site'];
            //let assetInfo = await assetLib.getTotalAsset(site);
            let pairItems = await trialMarketLib.trialAllNoLimit();
            let items = [].concat.apply([],pairItems);
            res.render('admin/priceDifferences',{ 
                differences: JSON.stringify(items)
                //assetInfo: JSON.stringify(assetInfo)
            });
        } catch (err){
            console.error(err);
            res.redirect('/500.html')
        }
    })

    router.post('/search', async function(req, res) {
        try{
            let pairItems = await trialMarketLib.trialAllNoLimit();
            let items = [].concat.apply([],pairItems);
            res.json(items);
        } catch (err){
            console.error(err);
            res.redirect('/500.html')
        }
    })
}