'use strict';
const mongoose = require('mongoose');
const Order  = mongoose.model('Order');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const TransferStrategyLog = mongoose.model('TransferStrategyLog');

const Api = require('./apiClient/api');
const realTimePrice = require('./realTimePrice');
const account = require('./account');

let transfer = new class{

    /**
     * 提交一个交易委托，并保存记录。 
     *
     * @param {Order} order, 交易委托 如{ site: "huobi", userName: "lcm", 
     *          amount: 12,price: 12, type: "buy" || "sell",reason: "调仓", symbol: 'btc' }
     * @param {ClientIdentifier} identifier
     * @public
     */
    * createTransfer(order,identifier){ //todo
        let api = new Api(identifier);
        let newOrder = new Order(order);

        newOrder.modified = new Date();
        newOrder.status = 'consign';

        if(order.isTest){
            newOrder = yield newOrder.save(newOrder); 
        } else {
            //todo 这里要考虑系统的鲁棒性
            let orderRes;
            let apiOptions = { symbol: newOrder.symbol, amount: newOrder.consignAmount, price: newOrder.price };

            if(order.side == "buy"){
                orderRes = yield api.buy(apiOptions);
            } else  if(order.side == "sell"){
                orderRes = yield api.sell(apiOptions);
            }

            if(!orderRes.isSuccess){
                throw new Error(`提交第三方交易平台委托失败。${orderRes.orderRes}`);
            }

            newOrder.outerId = orderRes.outerId;
            newOrder = yield newOrder.save(newOrder);  
        }

        let refreshAccountOptions = {
            userName: newOrder.userName, 
            symbol: newOrder.symbol,
            site: newOrder.site, 
            price: newOrder.price, 

            amount: newOrder.amount,
            consignAmount: newOrder.consignAmount,  //委托数量
            bargainAmount: 0, //已成交数量
            bargainChangeAmount: 0, //已成交数量的变更数

            side: newOrder.side
        };
        yield* account.refreshAccountTransfering(refreshAccountOptions,'create');

        return newOrder;
    }

   * refreshTransfers(){
       let operates = [];
       let transferStrategyLogs = yield TransferStrategyLog.find({ status: "wait"}); //todo 查询没有成功的转币纪录
       let sitesOperates = []; //结构为 [{ userName: "lcm", site: "huobi",operates: [TransferStrategyLog.operate,userName: '',]}]

       /*
        考虑到大部分交易所没有提供是否转币成功的接口，这里采取了一种根据帐户中货币的数量和转币记录来判断是否成功的方法
        （1）转币的时候数量尽量多几个小数，比如转帐1个比特币，实际操作时可以转1.000657892个
        （2）如果 帐户中货币的数量 = 转帐前帐户的数量 + 1次或几次转币数量，则说明这里计算的1次或几次转币已经成功
        （3）计算大数组的组合排列会很慢，没成功的转币操作不能超过15个
        （4）在转币的过程中，有可能发生其他类型的委托，比如交易，这需要加以考虑
       */

       for(let transferStrategyLog of transferStrategyLogs){
           for(let operate transferStrategyLog.operates){
               if(operate.status == 'wait' && operate.action == 'transfer'){
                   let existItem = sitesOperates.find(function(value){
                       return value.site == operate.transferTarget && value.userName == transferStrategyLog.userName;
                   });
                   
                   operate.transferStrategyLog = transferStrategyLog;
                   if(existItem){
                       sitesOperates.operates.push(operate);
                   } else {
                       sitesOperates.push({ 
                           userName: transferStrategyLog.userName, 
                           site: operate.transferTarget,
                           operates: [operate]
                       });
                   }
               }
           }   
       }

       for(let siteOperates of sitesOperates){
           let identifier = yield ClientIdentifier.findOne({ site: siteOperates.site, userName: siteOperates.userName,isValid: true });
           if(!identifier){
               //todo 最好记录
               continue;
           }
           
           let api = new Api(identifier);
           let account = yield api.getAccountInfo();
           if(!account){ //这里有可能是网络的问题导致获取失败
               continue;
           }

           let amounts = [];
           for(let operate of sitesOperates.operates){
               
               let operateIndex = sitesOperates.operates.indexOf(operate);
               for(let i = 0; i < sitesOperates.operates.length; i++){
                   let otherOperate = sitesOperates.operates[i];
                   if(i != operateIndex){
                       amounts.push(otherOperate.actualAmount); //notice:不能使用orderAmount有可能是百分比，并且有可能与实际上发生的金额不同
                   } 
               }

               let symbolAmount = 0;
               let symbolItem = account.totals.find(function(value,index){
                   return value.symbol == operate.symbol;
               });
               if(symbolItem){
                   symbolAmount = symbolItem.amount;
               }
               
               //TODO 还应当考虑其他交易
               let otherFixAmount = symbolAmount - otherOperate.accountAmount;

               
               let indexs = arrayCombine(amounts,otherFixAmount); //通过计算账户余额与转币的金额匹配情况，判断转币操作是否已经成功
               
               //TODO 这里还可以通过到帐时间的合理性来提高准确度

              
               if(indexs && indexs.length > 0){ 
                  for(let index of indexs){
                      let operate = sitesOperates.operates[index];
                      let transferStrategyLog = transferStrategyLogs.find(function(value,index){
                          return operate.transferStrategyLog._id == value._id;
                      });

                      //如果有后续需要进行的操作，执行后续操作
                      if(operate.nextOperate){
                          transferStrategyLog.currentStep = operate.nextOperate;

                          //执行后续操作
                          yield* runStrategyOperate(operate.nextOperate);
                      } else {
                          transferStrategyLog.status = "success";
                          transferStrategyLog.endTime = new Date();
                      }

                      //保存状态等
                      let orgOperate = transferStrategyLog.operates.find(function(value,index){
                          return value.id == operate.id;
                      });
                      if(orgOperate){
                          orgOperate.status = "success";
                          orgOperate.endTime = new Date();
                      }

                      transferStrategyLog.modified = new Date(); 
                      yield transferStrategyLog.save();
                  }
               }
           }
       }
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
            var flagArrs = getFlagArrs(len, n);
            while(flagArrs.length) {
                var flagArr = flagArrs.shift();
                var combArr = [], itemsTotal = 0;

                for(var i = 0; i < len; i++) {
                    if(flagArr[i]){
                        combArr.push(targetArr[i]);
                        itemsTotal += targetArr[i];
                    }
                }

                if(itemsTotal == totalAmount){
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

module.exports = transfer;