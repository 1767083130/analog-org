'use strict';

const symbolUtil = require('../utils/symbol');
const MethodsRunner = require('./methodsRunner');
const realTimePrice =  require('../realTimePrice');
const feeUtil = require('../fee');
const account = require('../account');
const common = require('../common');
const clientIdentifier = require('../clientIdentifier');
const order = require('../order');

const OperateReg = /(buy|sell|withdraw)\((.*)\)/i;

/**
 * 各种操作，比如买入、卖出、转币等
 */
let operate = new class {

    /**
     * 执行各种操作，比如买入、卖出、转币等
     * @param {String} expression 
     * @param {Object} envOptions 
     * @param {Boolean} isTransaction 是否为事务模式。如果为事务模式，则当其中一种表达式有误时，都统一不执行
     */
    async runOperates(expression,envOptions,isTransaction){
        let res = { isSuccess: false },
            operateExpresses = expression.split(';');

        let operates = [],isAllValid = true;
        for(let operateExpress of operateExpresses){
            operateExpress = operateExpress.trim();  
            if(!operateExpress) {
                continue;
            }      

            let operate = { isValid: true, express: operateExpress };
            let matches = operateExpress.match(OperateReg);
            if (matches && matches.index != -1) { //表达式为函数
                var funName = matches[1],
                    funArgsExpress = matches[2],
                    args;
                if(funArgsExpress){
                    try{
                        args = JSON.parse(funArgsExpress);
                        operate.args = args;
                        operate.funName = funName.toLowerCase();
                    } catch(e){
                        operate.isValid = false;
                        isAllValid = false;
                        operate.message = `错误的方法参数： ${funArgsExpress}`;
                    }
                } else {
                    operate.args =  [];
                }
            } else {
                operate.isValid = false;
                isAllValid = false;
                operate.message = `不识别的方法表达式，暂只支持buy、sell、withdraw`;
            }

            operates.push(operate);
        }
     
        if(isTransaction && !isAllValid){
            return { isSuccess: false, message: '有错误的表达式，全部停止执行' };
        }

        for(let operate of operates){
            operate.args = Object.assign({},operate.args,envOptions);
            switch(operate.funName.toLowerCase()){
            case 'buy':
                res = await this.buy(operate.args);
                break;
            case 'sell':
                res = await this.sell(operate.args);
                break;
            case 'withdraw':
                res = await this.withdraw(operate.args);
                break;
            default:
                res.message = `不支持的方法： ${funName}`;
                break;
            }
        }

        return res;
    }
    
    /**
     * 买入
     * 
     * @param {*} options 
     */
    async buy(options){
        options.side = 'buy';
        return await this._createOrder(options);
    }

    /**
     * 卖出
     * 
     * @param {*} options 
     */
    async sell(options){
        options.side = 'sell';
        return await this._createOrder(options);
    }

    /**
     * 提现
     */
    async withdraw(options){      
    }

    async _createOrder(options){
        let identifier = await clientIdentifier.getUserClient(options.userName,options.site);  
        if(!identifier){
            return  { isSuccess: false, errorCode: "100003", message: "client为空" };              
        }

        let orderItem = {
            site: options.site, //平台名称
            userName: options.userName, 
            isTest: options.isTest,
            side: options.side, //buy或sell
            type: options.type,
            reason: "operate", //原因
            symbol: options.symbol, //cny、btc、ltc、usd
            consignDate: new Date(), //委托时间

            price: options.price, //委托价格
            amount: options.amount, //总数量

            consignAmount: options.amount, //已委托数量
            isPostOnly: options.isPostOnly,
            isHidden: options.isHidden,
            //bargainAmount:  { type: Number, "default": 0 }, //已成交数量
            //prarentOrder: { type: Schema.ObjectId },
            //childOrder: { type: Schema.ObjectId }, 
            //actionId: transferStrategyLog._id,
            //operateId: logOperate._id, //操作Id
            isSysAuto: true,
            //outerId: String,  //外部交易网站的Id
            status: "wait", 

            created: new Date(), //创建时间
            modified: new Date() //最近修改时间
        };

        /**
         * 提交一个交易委托，并保存记录。 
         *
         * @param {Order} order, 交易委托 如{ site: "huobi", userName: "lcm", autoRetry: false,
         *          consignAmount: 12,price: 12, side: "buy" || "sell",reason: "调仓", symbol: 'btc' }
         * @param {ClientIdentifier} identifier,可为空
         * @returns {Object} 是否成功。如{
             { isSuccess: true, //是否成功
             actionId: newOrder._id, //委托Id
             order: newOrder } //委托交易
         */
        let res = await order.createOrder(orderItem,identifier);
        // if(res.isSuccess){
        //     //logOperate.undeal -= stepAmount;
        //     logOperate.consignAmount = new Decimal(logOperate.consignAmount).plus(stepAmount).toNumber();
        //     await transferStrategyLog.save();
        // }

        return res;  
    }

    // /**
    //  * 充值
    //  * @param {} options 
    //  */
    // * deposit(options){
    // }

}();

module.exports = operate