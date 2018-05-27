'use strict';
const mongoose = require('mongoose');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const TransferModel = mongoose.model('Transfer');
const EventEmitter = require('eventemitter2').EventEmitter2;
const Decimal = require('decimal.js');

const Api = require('./apiClient/api');
const account = require('./account');
const feeUtil = require('./fee');
const transferStatusChecker = require('./apiClient/transferStatusChecker');
const clientIdentifier = require('./clientIdentifier');

class Transfer extends EventEmitter{
    constructor(){
        super();
    }

    async runTransferOperate(operateLog, options){
        let res = { isSuccess: false };
        let operate = operateLog.orgOperate;
        let transferStrategyLog = operate.transferStrategyLog;
        if(!transferStrategyLog){
            res.message = "参数operate.trategyLog不能为空";
            res.errorCode = '100006';
            return res;
        }

        if(!options.identifier){
            res.message = "参数options.identifier不能为空";
            res.errorCode = '100006';
            return res;
        }

        if(!options.stepAmount || options.stepAmount <= 0){
            res.message = "参数options.stepAmount不能为空,并且不能小于或等于0";
            res.errorCode = '100006';
            return res;
        }

        if(operate.action != "transfer"){
            res.message = "operate.action不为transfer时，不能执行此方法";
            res.errorCode = '100006';
            return res;
        }

        let transferLog = {
            source: operate.transferSource, //移动路径源交易所
            target:  operate.transferTarget, //移动路径目标交易所
            //account: { type: Schema.ObjectId, ref: "Account" },
            userName: transferStrategyLog.userName, 
            isTest: transferStrategyLog.isTest,
            site: operate.site,

            reason: "transfer", //原因
            symbol: operate.symbol, //cny、btc、ltc、usd
            consignDate: new Date(), //委托时间
            consignAmount: options.stepAmount, //已委托数量
            //prarentTransfer: { type: Schema.ObjectId }, 
            //childTransfer: { type: Schema.ObjectId }, 
            actionId: transferStrategyLog._id, 
            operateId: operate.id, //操作Id
            accountAmount: operateLog.accountAmount,
            isSysAuto: true,

            //outerId: String,  //外部交易网站的Id
            status: "wait", 
            created: new Date(), 
            modified: new Date()
        };

        res = await this.createTransfer(transferLog,options.identifier);
        if(res.isSuccess){
            //operateLog.undeal -= stepAmount;
            operateLog.consignAmount = new Decimal(operateLog.consignAmount).plus(options.stepAmount).toNumber();
            await transferStrategyLog.save();
        }

        return res;
    }

    /**
     * 提交一个交易委托，并保存记录。 
     *
     * @param {TransferModel} transfer, 交易委托 如
       let transfer = {
            source: "huobi", //移动路径源交易所
            target: "okcoin", //移动路径目标交易所
            userName: "lcm", 
            symbol: "btc", //cny、btc、ltc、usd
            consignAmount: 12
        };
     * @param {ClientIdentifier} identifier
     * @returns {Object}  是否成功。如{ isSuccess: false, message: "交易平台返回错误信息：余额不足" }
     * @public
     */
    async createTransfer(transfer,identifier){ 
        let api = new Api(identifier);
        let newTransfer = new TransferModel(transfer);

        newTransfer.modified = new Date();
        newTransfer.status = 'consign';

        if(transfer.isTest){
            newTransfer = await newTransfer.save(newTransfer); 
        } else {
            //todo 这里要考虑系统的鲁棒性
            let address = ClientIdentifier.getWithdrawAddress(identifier,transfer.symbol);
            if(!address){
                return { isSuccess: false, message: `不存在网站${identifier.site}提币${transfer.symbol}地址`};
            }

            if(!identifier.safePassword){
                return { isSuccess: false, message: `不存在网站${identifier.site}提币${transfer.symbol}交易密码`};
            }
            
            let fees = feeUtil.getPayFee(identifier.site,transfer.symbol);
            if(fees === undefined){
                return { isSuccess: false, message: `未找到${identifier.site}提币${transfer.symbol}交易费用`};
            }

            let orderRes;
            let apiOptions = { 
                symbol: transfer.symbol, 
                amount: transfer.consignAmount,
                fees: fees, 
                safePassword:identifier.safePassword,
                address: address
            };

            let apiRes = await api.withdraw(apiOptions);
            if(!apiRes.isSuccess){
                return { isSuccess: false,message: `交易平台返回错误信息：${orderRes.message}` };
            }

            newTransfer.outerId = orderRes.outerId;
            newTransfer = await newTransfer.save(newTransfer);  
        }

        await account.refreshAccountTransfering(transfer,'create');
        return { isSuccess: true,actionId: newTransfer._id };
    }

    async finishTransfer(transfer){
        await this.refreshTransfer(transfer);

        let e = { transfer: transfer };
        this.emit('change',e);
    }

    async syncTransfers(stepCallBack){
        let createdStart = new Date(),
            createdEnd = new Date();
        createdStart.setTime( +new Date() - 2 * 24 * 60 * 60 * 1000 ) //2天前
        //createdEnd.setTime( +new Date() - 0.2 * 1000 ) //0.2秒前
        
        //todo 这里要注意系统的健壮性
        //获取未成功并且未取消的委托
        let userTransfers = { userName: "", orders: [] };          
        let transfers = await TransferModel.find({ 
            status:{ $in:['consign','part_success'] },
            consignDate: { $lt:createdEnd, $gt:createdStart }
        }).sort({ userName: -1}); //如果用户量大或者多服务器时，可以考虑改善这里的做法

        if(transfers.length > 0){
            await this._syncTransfers(transfers,stepCallBack);
        } else {
            let stepRes = { 
                userTransfers: userTransfers,
                isSuccess: true, 
                message: "没有需要同步的订单",
                stepCount: 0
            };
            stepCallBack && stepCallBack(stepRes);
        }
    }

    
    /**
     * 同步第三方交易平台和本系统间的订单状态,如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
     *
     * @param {Function(err, response)} stepCallBack
     * @public
     */
    async _syncTransfers(transfers,stepCallBack) {
        let userTransfers = { userName: "", transfers: [] }; 
          
        //处理委托。如果在一定时间内没有成交成功的委托，尝试重新提交新的委托；如果在第三方交易平台交易成功，则应同步状态
        let isNextUser = false; //是否又切换到另外一个用户的委托
        for(let i = 0; i < transfers.length; i++){
            
            //这里注意，先针对每个用户筛选出委托，然后对一个用户的所有委托，集中进行处理
            let transfer = transfers[i];
            if(!userTransfers.userName || transfer.userName == userTransfers.userName){
                isNextUser = false;
            }else{
                userTransfers.transfers = [];
                isNextUser = true;
            }

            userTransfers.userName = transfer.userName;
            userTransfers.transfers.push(transfer);
        
            if(isNextUser || i == transfers.length - 1){ //已收集完一个用户的需要处理的委托
                try{
                    let identifiers = await clientIdentifier.getUserClients(userTransfers.userName); 
                    if(!identifiers){
                        continue;
                    }

                    let allSiteTransfers = []; //数组项为用户某个网站的全部委托，如{ site: "huobi",transfers:[]}
                    for(let userTransfer of userTransfers.transfers){
                        let site = userTransfer.site, item;
                        item = allSiteTransfers.find(function(value){
                            return value.site == site;
                        });

                        if(!item){
                            item = { site: site, transfers: [] };
                            allSiteTransfers.push(item);
                        }
                        item.transfers.push(userTransfer); 
                    }

                    for(let siteTransfers of allSiteTransfers){
                        let identifier = identifiers.find(function(item){
                            return item.site == siteTransfers.site;
                        });
                        if(identifier){
                            //处理一个用户某个网站的所有委托
                            await this._syncUserTransfers(siteTransfers.transfers,identifier);
                            stepCallBack && stepCallBack({ userTransfers: userTransfers, isSuccess: true, message: `同步用户[${userTransfers.userName}]的委托成功`});
                        } else {
                            let stepRes = { 
                                userTransfers: userTransfers,
                                isSuccess: false, 
                                message: `同步用户[${userTransfers.userName}]的委托失败,找不到授权信息`,
                                stepIndex: i, 
                                stepCount: transfers.length 
                            };
                            stepCallBack && stepCallBack(stepRes);
                        }
                    }
                } catch(e) {

                    let stepRes = { 
                        userTransfers: userTransfers,
                        isSuccess: false, 
                        message: `同步用户[${userTransfers.userName}]的委托失败`,
                        stepIndex: i, 
                        stepCount: transfers.length 
                    };
                    stepCallBack && stepCallBack(stepRes);
                }
            }
        }//for
    }

     /**
      * 处理一个用户的所有委托.如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
      *
      * @param {Array(Transfer)} userTransfers
      * @param {Object} identifier 
      * @param {Function(err, response)} stepCallBack，单个委托处理后的回调函数
      * @private
      */
    async _syncUserTransfers(transfers,identifier){
        let successTransfers = [];
        for(let transfer of transfers){

            let existItem = successTransfers.find(function(value){
                return transfer._id.toString() == value._id.toString();
            });

            let isSuccess = !!existItem; 
            if(!isSuccess){
                let options = { transfers: transfers,identifier: identifier };
                let checkRes = transferStatusChecker.checkStatus(transfer,options);

                isSuccess = (checkRes.status == 'success');
                successTransfers = successTransfers.concat(checkRes.transfers);
            }

            if(isSuccess){
                await this.refreshTransfer(transfer);

                let e = { transfer: transfer };
                this.emit('change',e);
            } else {
                if(['wait','consign','part_success'].indexOf(transfer.status) != -1){
                    let e = { transfer: transfer,  timeDelayed: +new Date() - (+transfer.consignDate)  };
                    this.emit('delayed',e);
                }
            }
        }
    }

    /**
     * 转币完成后，对operateLog、account等进行相应处理
     * 
     * @private
     */
    async refreshTransfer(transfer){
         
        //if(['success','canceled','auto_retry','failed'].indexOf(order.status) != -1){
        //    //todo 因为获取的是外部网站的status为open的委托，
        //    //此时，应该是系统出问题了，最好记录下以便排查
        //    continue; 
        //}

        //更新账户信息
        let options = {
            source: transfer.source, //移动路径源交易所
            target: transfer.target, //移动路径目标交易所
            userName: transfer.userName, 
            coin: transfer.coin, //cny、btc、ltc、usd
            consignAmount: transfer.consignAmount //因为转币是一次性的，可以认为更改的金额就是转币操作涉及到的全部金额
        };
        
        let changeType = 'bargain'; 
        await account.refreshAccountTransfering(options, changeType);
                
        transfer.consignAmount = transfer.consignAmount;
        transfer.bargainAmount = transfer.consignAmount;
        transfer.status = 'success';
        transfer.modified = new Date();

        await transfer.save();
    }

}

module.exports = new Transfer()