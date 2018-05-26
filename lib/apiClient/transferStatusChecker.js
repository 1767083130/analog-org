'use strict';
const Api = require('./api');
const clientIdentifier = require('../clientIdentifier');
const order = require('../order');

const mongoose = require('mongoose');
const OrderModel = mongoose.model('Order');
const Transfer = mongoose.model('Transfer');
const AccountHistory = mongoose.model('AccountHistory');
const Decimal = require('decimal.js');

const Range_Float = 0.1;

/**
 * 判断转币是否成功
 */
let transferStatusChecker = new class {

    /**
     * 判断转币是否成功
     * @param {Transfer} 需要判断是否成功的转币操作
     * @param {orgSymbolAmount} 转币操作时，账户的初始余额
     * @param {options} e.g. { transfers,identifier}
     *     transfers：还未转币成功的转币操作。可以包含[需要判断是否成功的转币操作]
     *     identifier: 用户授权，可以为空 
     * @returns  e.g. { 
         isSuccess: true,  //执行是否成功
         status: "success", //转币操作的当前状态 wait,success
         transfers: successItems //其他也已经成功的转币操作
       }
     * @public
     */
    async checkStatus(transfer,options){
        /* 
        考虑到大部分交易所没有提供是否转币成功的接口，这里采取了一种根据帐户中货币的数量和转币记录来判断是否成功的方法
        （1）转币的时候数量尽量多几个小数，比如转帐1个比特币，实际操作时可以转1.000657892个
        （2）如果 帐户中货币的数量 = 转帐前帐户的数量 + 1次或几次转币数量，则说明这里计算的1次或几次转币已经成功
        （3）计算大数组的组合排列会很慢，没成功的转币操作不能超过15个
        （4）在转币的过程中，有可能发生其他类型的委托，比如交易，这需要加以考虑
        */

        //todo 比较耗时，脏读取数据的次数应该会比较多.解决的方法是锁住，不能进行相关的操作

        let orderChangeAmount = 0;//这段时间因为交易产生的账户余额变化量
        let symbolAmount = 0;     //账户中的币种金额
        let identifier = options.identifier;
        let transfers = options.transfers;

        if(!identifier){
            identifier = await clientIdentifier.getUserClient(transfer.userName,transfer.target);   
            if(!identifier){
                return { isSuccess: false };
            }
        }

        let api = new Api(identifier);

        //同步委托状态
        await order.syncUserRecentOrders(transfer.userName,[transfer.target]);

        // 获取账户中币种金额
        //(1)同步账户
        let getAccountRes = await api.getAccountInfo(); //todo 这里改为同步账户，可以为同步账户功能作一回贡献
        if(!getAccountRes || !getAccountRes.isSuccess){ //这里有可能是网络的问题导致获取失败
            return { isSuccess: false };
        }
        let account = getAccountRes.account;

        //(2)获取账户中币种金额
        let symbolItem = account.coins.find(function(value,index){
            return value.coin == transfer.coin;
        }); 
        if(symbolItem){
            symbolAmount = symbolItem.total;
        }
        
        //统计这段时间因为交易产生的账户余额变化量
        let orderChanges = await AccountHistory.aggregate(
            { 
                $match: { 
                    site: transfer.target,
                    userName: transfer.userName,
                    coin: transfer.coin,
                    exchangeType: { $ne : "transfer" },
                    created: { $gte: transfer.consignDate }
                } 
            },
            { 
                $group: { 
                    _id: null,
                    totalChange: { $sum:"$total" },
                    totalFrozen: { $sum:"$frozen" },
                    totalLoan: { $sum:"$loan" },
                    totalApply: { $sum: "$apply"}
                }
            }
        ).exec();
        
        if(orderChanges.length > 0){
            let orderChange = orderChanges[0];
            if(orderChange && orderChange.totalChange){
                orderChangeAmount = orderChange.totalChange;
            }
        }

        //获取金额列表
        let amounts = [];
        if(!transfers){
            transfers = await Transfer.find({userName: transfer.userName, status:{ $in:['consign','part_success'] } });
        }
        for(let item of transfers){
            if(item._id && transfer._id && item._id.toString() != transfer._id.toString()){
                amounts.push(item.consignAmount); //notice:不能使用orderAmount有可能是百分比，并且有可能与实际上发生的金额不同
            }
        }     

        //组合求值，判断出是否成功
        let otherFixAmount = new Decimal(symbolAmount).minus(transfer.accountAmount).minus(orderChangeAmount).toNumber();
        
        let res = { isSuccess: true, status: "wait" }; 
        if(otherFixAmount > 0){
            let indexs = this.arrayCombine(amounts,otherFixAmount); //通过计算账户余额与转币的金额匹配情况，判断转币操作是否已经成功

            if(indexs && indexs.length > 0){ //对已成功的转币操作进行处理
                let successItems = [];
                for(let index of indexs){
                    successItems.push(transfers[index]);
                }

                res = { isSuccess: true, status: "success",transfers: successItems };
            } 
        }

        return res;
    }

    
    /**
    * 获得指定数组的所有组合
    * @private
    */
    arrayCombine(targetArr,totalAmount) {
        if(!targetArr || !targetArr.length) {
            return;
        }
    
        var len = targetArr.length;
        //var resultArrs = [];
        //resultArrs.push(targetArr);
    
        // 所有组合
        for(var n = 1; n < len; n++) {
            var flagArrs = this.getFlagArrs(len, n);
            while(flagArrs.length) {
                var flagArr = flagArrs.shift();
                var combArr = [], itemsTotal = 0;

                for(var i = 0; i < len; i++) {
                    if(flagArr[i]){
                        combArr.push(targetArr[i]);
                        itemsTotal = new Decimal(itemsTotal).plus(targetArr[i]).toNumber();
                        //itemsTotal += targetArr[i];
                    }
                }

                let start = new Decimal(totalAmount).minus(Range_Float).toNumber();
                let end =  new Decimal(totalAmount).plus(Range_Float).toNumber();
                if(itemsTotal >= start && itemsTotal <= end){
                    return combArr; 
                    //resultArrs.push(combArr);
                }

                itemsTotal = 0;
            }
        }
        
        //return resultArrs;
    }
    
    
    /**
    * 获得从m中取n的所有组合
    * @private
    */
    getFlagArrs(m, n) {
        if(!n || n < 1) {
            return [];
        }
    
        var resultArrs = [],
            flagArr = [],
            isEnd = false,
            i, j, leftCnt;
    
        for (i = 0; i < m; i++) {
            flagArr[i] = i < n ? 1 : 0;
        }
    
        resultArrs.push(flagArr.concat());
    
        while (!isEnd) {
            leftCnt = 0;
            for (i = 0; i < m - 1; i++) {
                if (flagArr[i] == 1 && flagArr[i+1] == 0) {
                    for(j = 0; j < i; j++) {
                        flagArr[j] = j < leftCnt ? 1 : 0;
                    }
                    flagArr[i] = 0;
                    flagArr[i+1] = 1;
                    var aTmp = flagArr.concat();
                    resultArrs.push(aTmp);
                    if(aTmp.slice(-n).join("").indexOf('0') == -1) {
                        isEnd = true;
                    }
                    break;
                }
                flagArr[i] == 1 && leftCnt++;
            }
        }
        return resultArrs;
    }

}();

module.exports = transferStatusChecker;