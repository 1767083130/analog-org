'use strict';
const mongoose = require('mongoose');
const Order  = mongoose.model('Order');
const EventEmitter = require('eventemitter2').EventEmitter2;
const Decimal = require('decimal.js');
const Api = require('./apiClient/api');
const BothApi = require('./apiClient/bothApi');

const realTimePrice = require('./realTimePrice');
const account = require('./account');
const common = require('./common');
const clientIdentifier = require('./clientIdentifier');
const apiConfigUtil = require('./apiClient/apiConfigUtil');
const symbolUtil = require('./utils/symbol');

const DEFAULT_SYNC_INTEVAL = 1000 * 1.2; //1.2s

class OrderController extends EventEmitter{
    constructor(){
        super();
    }

    /**
     * 执行需要委托交易的差价策略的step
     * @param {Object} logOperate,对应TransferStrategyLog的operates项
     * @param {Object} options
     * @param {ClientIdentifier} [options.identifier], 可为空
     * @param {Number} options.stepAmount,差价策略每次委托金额
     * @param {Array} [options.depths] 市场深度
     * @param {Object} [options.priceSettings] 市场价格设置
     * @returns {Object} 是否成功。如{
         { isSuccess: true, //是否成功
           actionId: newOrder._id, //委托Id
           order: newOrder } //委托交易
     * @public
     */
    async runOrderOperate(logOperate,options){
        options = options || {};
        options.priceSettings =  options.priceSettings || {};

        let defaultPriceSettings = {
            ignoreStepsCount: 0,
            ignoreAmount: options.stepAmount,
            maxLossPercent: 5
        };
        options.priceSettings = Object.assign({},defaultPriceSettings,options.priceSettings);

        let res = { isSuccess: false };
        let operate = logOperate.orgOperate;
        let transferStrategyLog = logOperate.transferStrategyLog;
        let identifier = options.identifier; 
        let stepAmount = options.stepAmount;

        if(!stepAmount || stepAmount == 0){
            return { isSuccess: false, errorCode: "100006", message: "参数stepAmount不能为0" };
        }
        
        if(!transferStrategyLog){
            return  { isSuccess: false, errorCode: "100006", message: "参数operate.trategyLog不能为空" };
        }

        if(operate.action != "trade"){
            return  { isSuccess: false, errorCode: "100006", message: "operate.action不为trade时，不能执行此方法" };
        }

        if(!identifier){
            identifier = await clientIdentifier.getUserClient(transferStrategyLog.userName,operate.site);  
            if(!identifier){
                return  { isSuccess: false, errorCode: "100003", message: "client为空" };              
            }
        }

        let newDepths;
        if(options.depths){
            newDepths = options.depths.find(p => p.site == operate.site && p.symbol == operate.symbol);
        } else {
            let getDepthsRes = realTimePrice.getSymbolDepths(operate.site,operate.symbol);
            if(!getDepthsRes.isSuccess){
                return  { isSuccess: false, errorCode: "100003", message: "获取市场行情失败" };   
            }
            newDepths = getDepthsRes.data;
        }
        if(!newDepths){
            return  { isSuccess: false, errorCode: "100003", message: "获取市场行情失败" };    
        }

        let price = logOperate.price;

        /* 根据市场深度计算促成成交的最合适的价格 */
        let newPrice,depths = newDepths;
        let operateType = operate.side; 
        if(stepAmount < 0){
            operateType = (operateType == 'buy' ? 'sell' : 'buy');
        }
        let ignoreOptions = options.priceSettings;
        if(operate.isPostOnly){
            newPrice = this.getPostOnlyPrice(depths,operateType,ignoreOptions); 
        } else { //market 按市场价立即成交
            newPrice = this.getMarketPrice(depths,operateType,ignoreOptions)
        }
        price = newPrice;
        
        let order = {
            site: operate.site, //平台名称
            userName: transferStrategyLog.userName, 
            isTest: transferStrategyLog.isTest,
            side: operate.side, //buy或sell
            leverage: operate.leverage || 1,
            reason: "transfer", //原因
            symbol: operate.symbol, //cny、btc、ltc、usd
            consignDate: new Date(), //委托时间
            
            isPostOnly: operate.isPostOnly,
            price: price, //委托价格
            amount: stepAmount, //总数量

            consignAmount: stepAmount, //已委托数量
            //bargainAmount:  { type: Number, "default": 0 }, //已成交数量
            //prarentOrder: { type: Schema.ObjectId },
            //childOrder: { type: Schema.ObjectId }, 
            actionId: transferStrategyLog._id,
            operateId: operate.id, //logOperate._id, //操作Id
            strategyPlanId: transferStrategyLog.strategyPlanId,
            isSysAuto: true,
            //outerId: String,  //外部交易网站的Id
            status: "wait", 

            created: new Date(), //创建时间
            modified: new Date() //最近修改时间
        };

        res = await this.createOrder(order,identifier);
        if(res.isSuccess){
            //logOperate.undeal -= stepAmount;
            logOperate.consignAmount = new Decimal(logOperate.consignAmount).plus(stepAmount).toNumber();
            await transferStrategyLog.save();
        }

        return res;
    }

    /**
     * 提交一个交易委托，并保存记录。 
     *
     * @param {Order} order, 交易委托 如{ site: "huobi", userName: "lcm", autoRetry: false,
     *          consignAmount: 12,price: 12, side: "buy" || "sell",reason: "调仓", symbol: 'btc' }
     * @param {ClientIdentifier} [identifier] 可为空
     * @returns {Object} 是否成功。如{
         { isSuccess: true, //是否成功
           actionId: newOrder._id, //委托Id
           order: newOrder } //委托交易
     * @public
     */
    async createOrder(order,identifier,refreshAccount = false){
        if(!identifier){
            identifier = await clientIdentifier.getUserClient(order.userName,order.site); 
            if(!identifier){
                //todo 最好写入记录
                return { isSuccess: false, errorCode: "100003", message: `找不到授权信息.userName:${order.userName},site:${order.site} ` };
            }
        }

        //let api = new Api(identifier);
        let bothApi = new BothApi(identifier);
        let newOrder = new Order(order);
        newOrder.modified = new Date();

        newOrder.status = 'wait';
        newOrder = await newOrder.save(newOrder);  

        let orderRes;
        let apiOptions = { 
            symbol: newOrder.symbol, 
            side: newOrder.side,
            type: newOrder.type,
            leverage: newOrder.leverage || 1,
            amount: order.consignAmount, 
            price: newOrder.price,
            storeId: newOrder.storeId || 0,
            isHidden: newOrder.isHidden,
            isPostOnly: newOrder.isPostOnly
        };
        orderRes = await bothApi.createOrder(apiOptions);

        if(!orderRes.isSuccess){
            return { isSuccess: false, errorCode: "100005", message: `交易平台返回错误信息：${orderRes.message}` };
        } else {
            newOrder.status = 'consign';
            newOrder.outerId = orderRes.outerId;
            newOrder = await newOrder.save(newOrder);  
        }

        let refreshAccountOptions = {
            userName: newOrder.userName, 
            symbol: newOrder.symbol,
            leverage: newOrder.leverage || 1,
            site: newOrder.site, 
            price: newOrder.price, 

            amount: newOrder.amount,
            consignAmount: newOrder.consignAmount,  //委托数量
            bargainAmount: 0, //已成交数量
            bargainChangeAmount: 0, //已成交数量的变更数

            side: newOrder.side
        };

        if(refreshAccount){
            let newAccount = await account.refreshAccountTrading(refreshAccountOptions,'create');
            if(!newAccount){
                //todo 应当能弥补
                return { isSuccess: false, errorCode: "100002", message: `找不到账户信息,账户信息同步失败，但是有可能进行交易。userName：${newOrder.userName}，site: ${newOrder.site}` };
            }
        }

        return { isSuccess: true, order: newOrder };
    }

    /**
     * 修改委托单的价格以促使其快速成交
     * @param {*} order 委托单
     * @param {*} options 
     * @param {Number} [options.minStepsCount] 默认为1，当市场深度至少下探到minStepsCount个层级时，才修改价格.当IsPostOnly=true时有效
     * @param {Number} [options.minAmount] 默认为0，当市场深度至少下探到minAmount委托量时，才修改价格.当IsPostOnly=true时有效
     * @param {Number} [options.ignoreStepsCount] 默认为0，修改价格至离最优价格ignoreStepsCount个层级.当IsPostOnly=true时有效
     * @param {Number} [options.ignoreAmount] 默认为0，修改价格至离最优价格minAmount个委托数量.当IsPostOnly=true时有效
     * @param {Number} [options.maxLossPercent] 默认为5,最大能容忍的亏损百分比
     * @param {Boolean} [options.lazyMode] 默认为true。懒模式下，如果以前的价格相比根据设置参数计算出来的新价格更有利立即成交，则不会修改价格
     * @returns {Object} e.g { isSuccess: true, updated: true,order: order,oldOrder: oldOrder }
     */
    async updateOrderPrice(order,options){
        options = options || {};
        let defaultOptions = {
            minStepsCount: 1,
            minAmount: 0,
            ignoreStepsCount: 0,
            ignoreAmount: 0,
            maxLossPercent: 5,
            lazyMode: true
        };
        options = Object.assign({},defaultOptions,options);
        options.minStepsCount = Math.max(options.minStepsCount,1);
        options.minAmount = Math.max(options.minAmount,0);

        let getDepthsRes = realTimePrice.getSymbolDepths(order.site,order.symbol);
        if(!getDepthsRes.isSuccess){
            //TODO 最好写入记录
            return;
        }

        let operateType = order.side; 
        if(order.amount < 0){
            operateType = (operateType == 'buy' ? 'sell' : 'buy');
        }

        let newPrice,depths = getDepthsRes.data;
        /* 根据市场深度计算促成成交的最合适的价格 */
        let ignoreOptions = {
            ignoreStepsCount: options.ignoreStepsCount,
            ignoreAmount: options.ignoreAmount,
            maxLossPercent: options.maxLossPercent
        };
        if(order.isPostOnly){
            newPrice = this.getPostOnlyPrice(depths,operateType,ignoreOptions); 
        } else { //market 按市场价立即成交
            newPrice = this.getMarketPrice(depths,operateType,ignoreOptions)
        }

        /* 判断是否需要修改委托价格 */
        let willReplace = true;

        //根据委托价格判断
        if(options.lazyMode){
            if(operateType == 'sell'){
                willReplace = (newPrice < order.price ? true : false);
            } else { //buy
                willReplace = (newPrice > order.price ? true : false);
            }
            if(!willReplace){
                return { isSuccess: true, updated: false,message: "新的价格与以前价格相比，更不利于马上成交" };
            }
        }

        //根据最大能容忍的亏损百分比判断
        let orgPrice = (order.orgPrice == 0 || !order.orgPrice ? order.price : order.orgPrice);
        let canIngnore = true;
        if(operateType == 'buy'){
            canIngnore = ((newPrice < orgPrice * ( 1 + options.maxLossPercent / 100)) ? true : false);
        } else {
            canIngnore = ((newPrice > orgPrice * ( 1 - options.maxLossPercent / 100)) ? true : false);
        }

        if(!canIngnore){
            order.waitHuman = true;
            order.exceptions.push({
                name: 'maxLossPercent',    //名称。如"retry",重试； “cancel”，撤销；“consign”，委托; "maxLossPercent"，超最大最大能容忍的亏损百分比 
                alias: '超最大最大能容忍的亏损百分比',   //别名。如"冻结帐户金额"
                message: '超最大最大能容忍的亏损百分比',
                Manual: true, //是否需要人工处理
                status: 'wait', //status可能的值:wait,准备开始；success,已完成;failed,失败
                timestamp: +new Date() //最近一次修改日期
            });
            order = await order.save();
            willReplace = false;
        } 
        if(!willReplace){
            return { isSuccess: true, updated: false,message: `新价格已经超过最大能容忍的亏损百分比.newPrice:${newPrice},orgPrice:${orgPrice},maxLossPercent:${options.maxLossPercent} ` };
        }

        //根据options.minStepsCount判断
        if(order.isPostOnly){
            if(operateType == 'buy'){
                if(options.minStepsCount <= depths.bids.length){
                    willReplace = (depths.bids[options.minStepsCount - 1][0] > order.price);
                } else {
                    willReplace = true; //这时的options.minStepsCount设置失效了
                }
            } else { //sell
                if(options.minStepsCount <= depths.asks.length){
                    willReplace = (depths.asks[options.minStepsCount - 1][0] < order.price);
                } else {
                    willReplace = true; //这时的options.minStepsCount设置失效了
                }
            }
            if(!willReplace){
                return { isSuccess: true, updated: false,message: "根据设定的参数minStepsCount判断，暂时不需要修改价格" };
            }

             //根据options.minAmount判断
            let sum = 0,item,index = 0;
            let items = (operateType == 'buy' ? depths.bids : depths.asks);
            while(index < items.length){
                sum += items[index][1];
                if(sum >= options.minAmount){
                    break;
                }
                if(index < items.length){
                    index++;
                } 
            }

            if (operateType == 'buy'){
                willReplace = (items[index][0] > order.price);
            } else {
                willReplace = (items[index][0] < order.price);
            }
            if(!willReplace){
                return { isSuccess: true, updated: false,message: "根据设定的参数minAmount判断，暂时不需要修改价格" };
            }
        }

        //根据需要委托的量来判断
        //let totalLeft = (order.consignAmount - order.bargainAmount) *  newPrice;
        let totalLeft = order.consignAmount - order.bargainAmount;
        if(Math.abs(totalLeft) < 0.01){ //TODO 这里最好是先折算成美金 如果一个订单量< 0.01 则不再重新提交
            willReplace = false;
        }
        if(!willReplace){
            return { isSuccess: true, updated: false,message: "订单尚未成交的量小于0.01" };
        }

        /* 如果需要修改价格，执行修改操作 */
        let replaceOrderOptions = {
            price: newPrice,
            amount: totalLeft
        };
        let replaceOrderRes = await this.replaceOrder(order,replaceOrderOptions);
        return { 
            isSuccess: replaceOrderRes.isSuccess, 
            updated: !!replaceOrderRes.order,
            order: replaceOrderRes.order, 
            oldOrder: replaceOrderRes.oldOrder,
            message: replaceOrderRes.message
        };
    }

    /**
     * 当订单需要按照市场价成交时，应当进行的委托价格
     * @param {Object} depths 
     * @param {String} operateType 
     * @param {Object} options 
     * @param {Number} [options.ignoreStepsCount] 委托价格间隔市场深度价格的层级数，默认为0
     * @param {Number} [options.ignoreAmount] 需要保证成交的订单委托数量，比如1个btc#usd，默认为0
     * @public
     */
    getMarketPrice(depths,operateType,options){
        options = options || {};

        let defaultOptions = {
            ignoreStepsCount: 0,
            ignoreAmount: 0
        }
        options = Object.assign({},defaultOptions,options);

        let oneStepPrice = this._getOneStepPrice(depths);
        let stepsCount = options.stepsCount || 1;
        let stepPrice = new Decimal(stepsCount).times(oneStepPrice);
        let items = (operateType == 'buy' ? depths.asks : depths.bids);

        let getPlusStepPrice = function(index){
            let price;
            if(operateType == 'buy'){
                price = new Decimal(depths.asks[index][0]).plus(stepPrice);
            } else { //sell
                price = new Decimal(depths.bids[index][0]).minus(stepPrice);
            }
            return price.toNumber();
        }

        let basePrice = getPlusStepPrice(0);

        //options.ignoreAmount
        if(options.ignoreAmount && options.ignoreAmount > 0){
            let sum = 0,item,index = 0;
            while(index < items.length){
                sum += items[index][1];
                if(sum > options.ignoreAmount){
                    break;
                }
                index++;
            }

            let nextIndex = (items.length - 1 > index + 1 ? index + 1 : index);
            let minAmountPrice = getPlusStepPrice(nextIndex);
            basePrice = (operateType == 'buy' ? Math.max(minAmountPrice,basePrice) : Math.min(minAmountPrice,basePrice)); 
        }

        //options.ignoreStepsCount
        if(options.ignoreStepsCount && options.ignoreStepsCount > 0){
            let nextIndex = Math.min(options.ignoreStepsCount,items.length - 1);
            let ignoreStepsPrice = getPlusStepPrice(nextIndex);
            basePrice = (operateType == 'buy' ? Math.max(ignoreStepsPrice,basePrice) : Math.min(ignoreStepsPrice,basePrice)); 
        }

        return basePrice;
    }

    /**
     * 当订单需要按照被动成交(PostOnly)时，应当进行的委托价格
     * @param {Object} depths 
     * @param {String} operateType 
     * @param {Object} options 
     * @param {Number} [options.ignoreStepsCount] 委托价格间隔市场深度价格的层级数，默认为0
     * @param {Number} [options.ignoreAmount] 订单委托数量，比如1个btc#usd，默认为0  
     * @public
     */
    getPostOnlyPrice(depths,operateType,options){
        options = options || {};

        let defaultOptions = {
            ignoreStepsCount: 0,
            ignoreAmount: 0,
            maxLossPercent: 5
        }
        options = Object.assign({},defaultOptions,options);

        let oneStepPrice = this._getOneStepPrice(depths);
        let stepsCount = options.stepsCount || 1;
        let stepPrice = new Decimal(stepsCount).times(oneStepPrice);
        let items = (operateType == 'buy' ? depths.bids : depths.asks);

        let getPlusStepPrice = function(index){
            return items[index][0];
        }
        let basePrice = getPlusStepPrice(0);

        //options.ignoreAmount
        if(options.minAmount > 0){
            let sum,item,index = 0;
            while(index < items.length){
                sum += items[index][1];
                if(sum > options.minAmount){
                    break;
                }
                index++;
            }

            let nextIndex = (items.length - 1 > index + 1 ? index + 1 : index);
            let minAmountPrice = getPlusStepPrice(nextIndex);
            basePrice = (operateType == 'buy' ? Math.min(minAmountPrice,basePrice) : Math.max(minAmountPrice,basePrice)); 
        }

        //options.ignoreStepsCount
        if(options.ignoreStepsCount > 0){
            let nextIndex = Math.min(options.ignoreStepsCount,items.length - 1);
            let ignoreStepsPrice = getPlusStepPrice(nextIndex);
            basePrice = (operateType == 'buy' ? Math.min(ignoreStepsPrice,basePrice) : Math.max(ignoreStepsPrice,basePrice)); 
        }

        return basePrice;
    }

    _getOneStepPrice(depths){
        let getDigitLen = function(s){
            let parts = s.toString().split('.');
            if(parts.length == 2){
                digitLen = parts[1].length;
            } else { //== 1
                digitLen = 0;
            }
            return digitLen;
        }
        let digitLen, digitLenTemp;

        //求最小的阶梯价，比如已知市场价格1.321，那么阶梯价格为0.001
        //NOTINCE：当市场深度价格为一个整10的数据时候，比如1.300,后面两个0可能并没有，求出的阶梯价格就有误，
        //        这里解决方法是求两次，然后取最长的为准
        digitLen = getDigitLen(depths.bids[0][0]);
        if(depths.bids.length > 1){
            digitLenTemp = getDigitLen(depths.bids[1][0]);
            digitLen = Math.max(digitLen,digitLenTemp);
        }
        let minStep = 1;
        if(digitLen > 0){
            minStep = 1 / Math.pow(10,digitLen);
        }

        return minStep;
    }

    /**
     * 修改下单
     *
     * @param {Object} order 需要修改的订单 eg. { outerId: 123432, symbol: "btc#usd" }
     * @param {Object} options  请求参数，如 { amount: 0.1, price: 1,side: "buy"}
     * @param {Number} [options.amount] 
     * @param {Number} [options.price] 
     * @param {String} [options.side]  可能的值有buy、sell
     * @param {String} [options.type] Either “market” / “limit” / “stop” / “trailing-stop” / “fill-or-kill” 
                               / “exchange market” / “exchange limit” / “exchange stop” / “exchange trailing-stop” 
                               / “exchange fill-or-kill”. (type starting by “exchange ” are exchange orders, others are margin trading orders)
     * @param {Boolean} [options.isHidden] 
     * @param {Boolean} [options.isPostOnly] 感觉是fill or kill的反面，也就是说，如果提交了post-only单，且这个单子会立刻成交的话，就自动撤单（或者移开一个最小价位）。只有这个单子能挂上去不被立刻成交的时候才会下单。
     * @returns { isSuccess: true, order: newOrder,oldOrder: oldOrder } id: 挂单ID; result: true(成功), false(失败)
     */
    async replaceOrder(order, options) {
        let identifier = options.identifier;
        if(!identifier){
            identifier = await this._getIdentifier(order);
            if(!identifier){
                return { isSuccess: false, errorCode: "100003", message: `找不到授权信息.userName:${order.userName},site:${order.site} ` };
            }
        }

        let symbolInfo = symbolUtil.getFullSymbol(order.symbol,identifier.site);
        let bothApi = new BothApi(identifier); 

        let amount, price; 
        if(options.amount && options.amount != 0){
            amount = options.amount;
        } else {
            amount = new Decimal(order.consignAmount).minus(order.bargainAmount).toNumber();
        }
      
        if(options.price && options.price != 0){
            price = options.price;
        } else {
            price = order.price;
        }

        let apiRes;
        let replaceOrderSupported = ['bitfinex'].indexOf(order.site) != -1; //TODO 在配置文件中配置更合适
        if(replaceOrderSupported){ //如果api直接支持replaceOrder接口
            options.identifier = identifier;
            apiRes = await bothApi.replaceOrder(order, options)
            if(!apiRes.isSuccess){
                return { isSuccess: false, errorCode: "100005", message: `交易平台返回错误信息：${orderRes.message}` };
            } 

            let newOrder;
            if(order.outerId == apiRes.outerId){ //如果只是修改委托
                newOrder = Object.assign({},order,options);
                newOrder.modified = new Date();
                newOrder = await newOrder.save(); 
                order = newOrder;
            } else { //生成了新的委托
                let orderOptions = {
                    site: order.site, //平台名称
                    userName: order.userName, 
                    isTest: order.isTest,
                    side: order.side, //buy或sell
                    leverage: order.leverage || 1,
                    reason: order.reason, //原因
                    symbol: order.symbol, //cny、btc、ltc、usd
                    consignDate: new Date(), //委托时间
                    
                    isPostOnly: order.isPostOnly,
                    price: price, //委托价格
                    amount: amount, //总数量
                    consignAmount: amount, //已委托数量
                    //bargainAmount:  { type: Number, "default": 0 }, //已成交数量
                    parentOrder: order._id,
                    //childOrder: { type: Schema.ObjectId }, 
                    actionId: order.actionId,
                    operateId: order.operateId, //操作Id
                    isSysAuto: true,
                    outerId: apiRes.outerId,  //外部交易网站的Id
                    status: "consign", 
                    created: new Date(), //创建时间
                    modified: new Date() //最近修改时间
                };
                newOrder = new Order(orderOptions);
                newOrder = await newOrder.save(); 

                order.status = 'auto_retry';
                order.childOrder = newOrder._id;
                order = await order.save();
            }

            return { isSuccess: true, order: newOrder, oldOrder: order };
        } else {
            let newOrderOptions = {
                price: price,
                amount: amount
            }; //TODO 暂时只支持价格和数量的变更
            let retryRes = await this.retryOrder(order,newOrderOptions,identifier);
            return retryRes;
        }
    }


    /**
     * 取消订单
     * 
     * @param {Order} order
     * @identifier {ClientIdentifier} [identifier] 
     * @returns 如{ isSuccess: false, errorCode: "100006",message: "参数错误。order不能为空" }
     * @public
     */
    async cancelOrder(order,identifier,refreshAccount = false){
        if(!order){    
            return { isSuccess: false, errorCode: "100006",message: "参数错误。order不能为空" };
        } 
        if(!identifier){
            identifier = await this._getIdentifier(order);
            if(!identifier){
                return { isSuccess: false, errorCode: "100003", message: `找不到授权信息.userName:${order.userName},site:${order.site} ` };
            }
        }

        order.status = 'will_cancel';
        await order.save();

        let api = new BothApi(identifier);
        if(["buy","sell"].indexOf(order.side) == -1){
            return { isSuccess: false, errorCode: "100006",message: "参数错误。order.side必须为buy或sell" };    
        }

        //先撤消原有委托
        let cancelOrderRes = await api.cancelOrder({
            id: order.outerId,
            symbol: order.symbol
        });
        if(!cancelOrderRes.isSuccess){
            order.exceptions.push({
                name: 'cancel',    //名称。如"retry",重试； “cancel”，撤销；“consign”，委托
                alias: '取消订单时发生错误',   //别名。如"冻结帐户金额"
                message: cancelOrderRes.message,
                Manual: true, //是否需要人工处理
                status: 'wait', //status可能的值:wait,准备开始；success,已完成;failed,失败
                timestamp: + new Date() //时间戳
            });
            order.save(); 
            return { isSuccess: false, errorCode: "100005", message: `调用api撤消委托失败。${cancelOrderRes.message}` };
        }

        if(cancelOrderRes.isSuccess){
            ////这里有可能产生脏数据，应重新获取订单详情
            //let fetchOrderRes = await api.fetchOrder({id: order.outerId,symbol: order.symbol});
            //if(fetchOrderRes.isSuccess){
            //    order.consignAmount = fetchOrderRes.order.consignAmount;
            //    order.bargainAmount = fetchOrderRes.order.bargainAmount;
            //} 

            //更改本地的委托
            order.status = "canceled";
            //order.status = "will_cancel";
            order.modified = Date.now();
            order = await order.save();

            if(refreshAccount){
                let changeType = 'cancel';
                let changeAmount = new Decimal(order.consignAmount).minus(order.bargainAmount).toNumber(); 
                                // order.consignAmount - order.bargainAmount;
                //更新账户信息
                let options = {
                    userName: order.userName, 
                    symbol: order.symbol,
                    site: order.site, 
                    price: order.price, 

                    consignAmount: 0,
                    bargainAmount: 0,
                    bargainChangeAmount: changeAmount,

                    side: order.side
                };
                await account.refreshAccountTrading(options, changeType);

            }
        } 

        return { isSuccess: true };
    }

    /**
     * 撤销未成交的委托，重新提交新的委托
     *
     * @param {Order} order
     * @param {Object} newOrderOptions
     * @param {Number} newOrderOptions.price 价格
     * @param {Number} newOrderOptions.amount 委托数量
     * @param {ClientIdentifier} [identifier]
     * @returns { isSuccess: true,order: newOrder,oldOrder: oldOrder }
     * @public
     */
    async retryOrder(order,newOrderOptions,identifier,refreshAccount = false){
        //let api = new Api(identifier);
        if(!identifier){
            identifier = await clientIdentifier.getUserClient(order.userName,order.site);  
            if(!identifier){
                return { isSuccess: false, message: `找不到授权信息。userName: ${order.userName},site: ${order.site}`};             
            }
        }

        let res = { isSuccess: false };
        if(["buy","sell"].indexOf(order.side) == -1){
            res.errorCode = '100006';
            res.message = "order.side必须为buy或sell"
            return res;
        }

        //先撤消原有委托
        let cancelRes = await this.cancelOrder(order,identifier);
        if(!cancelRes.isSuccess){
            return cancelRes;
        }

        //生成一个新的委托 
        var newOrder = new Order({
            site: order.site, //平台名称
            userName: order.userName, 
            isTest: order.isTest,
            side: order.side, //buy或sell
            type: order.type,
            leverage: order.leverage || 1,
            reason: order.reason, //原因
            symbol: order.symbol, //cny、btc、ltc、usd
            consignDate: Date.now(), //委托时间
            price: newOrderOptions.price, //委托价格
            orgPrice: order.orgPrice,
            amount: newOrderOptions.amount, //总数量
            consignAmount: 0, //已委托数量
            bargainAmount: 0, //已成交数量
            bargainSourceAmount: 0,
            prarentOrder: order._id, //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                     //那末，新的委托的prarentOrder就为此委托.一个委托至多只会发起一个新的委托
            childOrder: null,   //如果一定时间未成交成功，可能会针对这个委托以不同的价格重新发起一个新的委托，
                                                     //那末，此委托的childOrder就为新委托

            bargains: [], //已成交列表
            actionId: order.actionId,
            operateId: order.operateId,
            strategyPlanId: order.strategyPlanId,
            //outerId: String,  //外部交易网站的Id
            queues:[], 
            status: "wait",
            isSysAuto: order.isSysAuto,
            // previousOrder: order.previousOrder,//前置交易
            // nextOrder: order.nextOrder, //后置交易
            isHidden: order.isHidden,
            isPostOnly: order.isPostOnly,
            created: Date.now(), //创建时间
            modified: Date.now() //最近修改时间
        });
        
        newOrder = await Order.create(newOrder);
        if(!newOrder){
            res.errorCode = '200000';
            res.message = "添加order失败"
            return res;
        }

        //更改本地的委托
        order.status = "auto_retry";
        order.modified = Date.now();
        order.childOrder = newOrder._id; 
        order = await order.save();

        //向交易网站提交委托
        let bothApi = new BothApi(identifier);
        let apiOrder = {
            site: newOrder.site,
            symbol: newOrder.symbol,
            side: newOrder.side,
            leverage: newOrder.leverage || 1,
            amount: newOrder.amount,
            price: newOrder.price
        };
        let apiRes = await bothApi.createOrder(apiOrder);
        if(!apiRes.isSuccess){
            res.errorCode = '100005';
            res.message = `调用api撤消委托失败。${apiRes.message}`;
            return res;
        }

        newOrder.outerId = apiRes.outerId;
        newOrder.consignAmount = apiOrder.amount;
        newOrder.status = "consign";
        newOrder.modified = Date.now();
        newOrder = await newOrder.save();

        if(refreshAccount){
            //更新账户信息
            let changeType = 'create';
            let options = {
                userName: newOrder.userName, 
                symbol: newOrder.symbol,
                side: newOrder.side,
                leverage: newOrder.leverage || 1,

                site: newOrder.site, 
                price: newOrder.price, 

                amount: newOrder.amount,
                consignAmount: newOrder.consignAmount,
                bargainAmount: 0,
                bargainChangeAmount: 0
            };
            await account.refreshAccountTrading(options, changeType);
        }

        res.isSuccess = true;
        res.order = newOrder;
        res.oldOrder = order;
        return res;
    }

    /**
     * 同步第三方交易平台和本系统间的订单状态,如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
     *
     * @param {Object} options,参数,e.g.
       { 
          since: ((+new Date() - 8 * 60 * 60 * 1000) / 1000) | 0, //如果为空，则默认为8小时内
          sites: ['chbtc','btcorder']
       }
     * @param {Function(err, response)} stepCallBack
     * @public
     */
    async syncOrdersByInteval(options,stepCallBack) {
        let createdStart = new Date();

        options = options || {};
        let since = options.since || (((+new Date() - 8 * 60 * 60 * 1000) / 1000) | 0);
        createdStart.setTime(since); //8小时前

        let platforms = apiConfigUtil.getPlatforms();
        for(let platform of platforms){
            if(options.sites && options.sites.indexOf(platform.site) == -1){
                continue;
            }
            if(apiConfigUtil.getMethodType(siteItem.site,'market',1) != 'restful'){
                continue;
            }

            let syncSiteOrders = async function(){
                let syncOptions = {
                    site: platform.site
                };
                await this.syncOrders(syncOptions,stepCallBack);
            }.bind(this);

            let inteval = platform.syncOrdersInteval || DEFAULT_SYNC_INTEVAL;
            setInterval(syncSiteOrders, inteval);
        }
    }

    /**
     * 同步第三方交易平台和本系统间的订单状态,如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
     *
     * @param {Object} options,参数,e.g.
       { 
          since: ((+new Date() - 8 * 60 * 60 * 1000) / 1000) | 0, //如果为空，则默认为8小时内
          site: 'btctrade' //为空时，同步全部网站的委托  
       }
     * @param {Function(err, response)} stepCallBack
     * @public
     */
    async syncOrders(options,stepCallBack) {
        let createdStart = new Date(),
            createdEnd = new Date();
        let orders;

        options = options || {};
        let since = options.since || (((+new Date() - 8 * 60 * 60 * 1000) / 1000) | 0);
        createdStart.setTime(since); //8小时前

        let filter = { 
            status:{ $in:['consign','part_success','will_cancel'] },
            consignDate: { $lt:createdEnd, $gt:createdStart }
        };
        if(options.site){
            filter.site = options.site;
        }

        //todo 这里要注意系统的健壮性
        //获取未成功并且未取消的委托  
        orders = await Order.find(filter).sort({ userName: -1}); //todo 如果用户量大或者多服务器时，可以考虑改善这里的做法

        if(orders.length == 0){
            let stepRes = { 
                orders: orders,
                isSuccess: true, 
                message: "没有需要同步的订单",
                stepCount: 0
            };
            stepCallBack && stepCallBack(stepRes);
        }

        await this._syncRecentOrders(since,orders,stepCallBack);
    }

     /**
      * 处理一个用户的所有委托.如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
      *
      * @param {Array(Order)} userOrders
      * @param {Object} identifier 
      * @param {Function(err, response)} stepCallBack，单个委托处理后的回调函数
      * @private
      */
    async syncUserRecentOrders(userName,sites,stepCallBack){
        let createdStart = new Date(),
            createdEnd = new Date();
        let since = ((+new Date() - 8 * 60 * 60 * 1000) / 1000) | 0; //8小时前
        createdStart.setTime(since) 
        //createdEnd.setTime( +new Date() - 0. * 1000 ) //0.1秒前
       
        //获取未成功并且未取消的委托
        let userOrders = { userName: "", orders: [] };          
        let orders = await Order.find({ 
            userName: userName,
            site: { $in: sites },
            status:{ $nin:['success','canceled','auto_retry'] },
            created: { $lt:createdEnd, $gt:createdStart }
        }); 

        if(orders.length > 0){
            await this._syncRecentOrders(since,orders,stepCallBack);
        } else {
            let stepRes = { 
                userOrders: userOrders,
                isSuccess: true, 
                message: "没有需要同步的订单",
                stepCount: 0
            };
            stepCallBack && stepCallBack(null,stepRes);
        }
    }


    /**
     * 同步第三方交易平台和本系统间的订单状态,如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
     *
     * @param {Function(response)} stepCallBack
     * @public
     */
    async _syncRecentOrders(since,orders,stepCallBack) {
        let userOrders = { userName: "", orders: [] };   

        //处理委托。如果在一定时间内没有成交成功的委托，尝试重新提交新的委托；如果在第三方交易平台交易成功，则应同步状态
        let isNextUser = false; //是否又切换到另外一个用户的委托
        for(let i = 0; i < orders.length; i++){
            
            //这里注意，先针对每个用户筛选出委托，然后对一个用户的所有委托，集中进行处理
            let order = orders[i];
            if(!userOrders.userName || order.userName == userOrders.userName){
                isNextUser = false;
            }else{
                userOrders.orders = [];
                isNextUser = true;
            }

            userOrders.userName = order.userName;
            userOrders.orders.push(order);
        
            if(isNextUser || i == orders.length - 1){ //已收集完一个用户的需要处理的委托
                try{
                    let identifiers = await clientIdentifier.getUserClients(userOrders.userName); 
                    if(!identifiers){
                        continue;
                    }

                    let allSiteOrders = []; //数组项为用户某个网站的全部委托，如{ site: "huobi",orders:[]}
                    for(let userOrder of userOrders.orders){
                        let site = userOrder.site, item;
                        item = allSiteOrders.find(function(value){
                            return value.site == site;
                        });

                        if(!item){
                            item = { site: site, orders: [] };
                            allSiteOrders.push(item);
                        }
                        item.orders.push(userOrder); 
                    }

                    for(let siteOrders of allSiteOrders){
                        let identifier = identifiers.find(function(item){
                            return item.site == siteOrders.site;
                        });
                        if(identifier){
                            //处理一个用户某个网站的所有委托
                            await this._syncUserRecentOrders(since,siteOrders.orders,identifier);
                            stepCallBack && stepCallBack(null,{ 
                                userOrders: userOrders, 
                                isSuccess: true, 
                                message: `同步用户[${userOrders.userName}]的委托成功`
                            });
                        } else {
                            let stepRes = { 
                                userOrders: userOrders,
                                isSuccess: false, 
                                message: `同步用户[${userOrders.userName}]的委托失败,找不到授权信息`,
                                stepIndex: i, 
                                stepCount: orders.length 
                            };
                            stepCallBack && stepCallBack(null,stepRes);
                        }
                    }
                } catch(e) {
                    console.error(e);
                    let stepRes = { 
                        userOrders: userOrders,
                        isSuccess: false, 
                        message: `同步用户[${userOrders.userName}]的委托失败`,
                        stepIndex: i, 
                        stepCount: orders.length 
                    };
                    stepCallBack && stepCallBack(e,stepRes);
                }
            }
        }//for
    }

     /**
      * 处理一个用户的所有委托.如果在一定时间内没有成交成功的委托，尝试重新提交新的委托
      *
      * @param {Number}  since,秒级时间戳
      * @param {Array(Order)} userOrders
      * @param {Object} identifier 
      * @param {Function(err, response)} stepCallBack，单个委托处理后的回调函数
      * @private
      */
    async _syncUserRecentOrders(since,orders,identifier){
        let api = new Api(identifier);
        let outerOrders = [];
        
        //将委托按照币种分类
        let symbolsOrders = [];
        for(let order of orders){
            let item = symbolsOrders.find(function(value){
                return value.symbol == order.symbol;
            });
            if(item){
                item.orders.push(order);
            } else {
                symbolsOrders.push({
                    symbol: order.symbol,
                    orders: [order]
                });
            }
        }
        
        //获取委托的最新状态
        for(let symbolOrders of symbolsOrders){
            var options = {
                since: since, //8小时前
                symbol: symbolOrders.symbol,  //交易币种（btc#cny,eth#cny,ltc#cny,doge#cny,ybc#cny）
                type: 'all'  //  挂单类型[open:正在挂单, all:所有挂单]
            };
            let getOrdersRes = await api.fetchRecentOrders(options);
            if(!getOrdersRes.isSuccess || !getOrdersRes.orders){
                throw new Error(`获取第三方交易平台委托失败。${getOrdersRes.message}`); //todo待确认
            }
            outerOrders = [].concat(outerOrders,getOrdersRes.orders);
        }

        for(let order of orders){
            if(order.status == 'wait'){
                continue;
            }

            let outerOrder = outerOrders.find(function(value){
                return value.outerId == order.outerId;
            });

            if(!outerOrder && order.outerId){
                let getOrderRes = await api.fetchOrder({id: order.outerId,symbol: order.symbol });
                if(getOrderRes.isSuccess){
                    outerOrder = getOrderRes.order;
                }
            }

            if(outerOrder){
                this.syncOrder(outerOrder,order,identifier);
            }
        }

        //todo 待确认
        // for(let outerOrder of outerOrders){
        //     let order = orders.find(function(value){
        //         return value.outerId == outerOrder.outerId;
        //     });

        //     outerOrder.userName = identifier.userName;
        //     if(!order){
        //         let order = this.getOrder(outerOrder);
        //         order = new Order(order);
        //         await order.save();  
        //     } 
        // }
    }

    /**
     * 同步订单
     *
     * @param {Order} newOrder 系统存在的旧订单
     * @param {Order} {oldOrder} 新订单
     * @param {ClientIdentifier} [identifier] 用户授权信息
     * @api public
     */
    async syncOrder(newOrder,oldOrder,identifier){
        if(!oldOrder){
            oldOrder = await Order.find({ outerId: oldOrder.id })
        }

        if(!oldOrder){
            oldOrder = newOrder;
        }

        if(!identifier){
            identifier = await clientIdentifier.getUserClient(oldOrder.userName,oldOrder.site);  
            if(!identifier){
                throw new Error(`client为空.site:${oldOrder.site},userName:${oldOrder.userName}`);
                //return  { isSuccess: false, errorCode: "100003", message: "client为空" };              
            }
        }

        let changeAmount = new Decimal(newOrder.bargainAmount).minus(oldOrder.bargainAmount).toNumber(); //更改帐户的金额
        if(changeAmount > 0){
            await this.refreshOrder(oldOrder,newOrder,identifier);

            let e = { order: oldOrder,  changeAmount: changeAmount,status: newOrder.status };
            this.emit('change',e);
        } else {
            if(['wait','consign','part_success'].indexOf(oldOrder.status) != -1){
                let e = { order: oldOrder,  timeDelayed: +new Date() - (+order.consignDate),status: newOrder.status  };
                this.emit('delayed',e);
                //this.orderDelayedEvent.trigger(e);
            }
        }
    }

    /**
     * 数量划算
     * @param {*} amount 
     * @param {*} price 
     * @param {*} symbol 
     * @param {*} unit 
     */
    getRealAmount(amount,price,symbol,unit){
        unit && (unit = unit.replace(/(^\s*)|(\s*$)/g,""));
        if(!unit || unit == ''){
            return amount;
        }

        let symbolParts = symbolUtil.getSymbolParts(symbol);
        let unitAmount,unitName;
        if(unit.indexOf('_') != -1){
            let parts = position.unit.split('_');
            unitAmount = parts[0];
            unitName = parts[1];
        } else {
            unitAmount = 1;
            unitName = unit;
        }
        
        if([symbolParts.targetCoin,symbolParts.settlementCoin].indexOf(unitName) == -1){
            throw new Error(`非法的unitName值：${unitName}，必须为${symbolParts.targetCoin}或${symbolParts.settlementCoin}`)
        }

        let realAmount;
        if(unitName == symbolParts.targetCoin){
            realAmount = new Decimal(unitAmount).times(amount).toNumber();
        } else { //unitName == symbolParts.settlementCoin 
            realAmount = new Decimal(unitAmount).times(amount).div(price).toNumber();
        }
        return realAmount;
    }

    getOrder(outerOrder){
        return {
            site: outerOrder.site, //平台名称
            userName: outerOrder.userName, 
            isTest: false,
            side: outerOrder.side, //buy或sell
            leverage: outerOrder.leverage || 1,

            reason: "outer", //原因
            symbol: outerOrder.symbol, //cny、btc、ltc、usd

            consignDate: outerOrder.consignDate, //委托时间
            price: outerOrder.price, //委托价格
            amount: outerOrder.consignAmount, //总数量
            consignAmount: outerOrder.consignAmount, //已委托数量
            bargainAmount: outerOrder.bargainAmount, //已成交数量
            status: status,
            isSysAuto: false,
            created: Date.now(), //创建时间
            modified: Date.now() //最近修改时间
        };
    }

    /**
     * 订单完成或完成部分后，对operateLog、account等进行相应处理
     * @param {Order} order
     * @param {Order} apiOrder,外部更新的委托交易
           dealAmount: apiOrder.amount, //已处理数量
           amount: apiOrder.amountOrig, //已委托数量
           created: +apiOrder.mtsCreate,
           price: apiOrder.price,
           avgPrice: apiOrder.priceAvg,
           status: status,//status可能的值:wait,准备开始；consign: 已委托,但未成交；success,已完成; 
                        //part_success,部分成功;will_cancel,已标记为取消,但是尚未完成;canceled: 已取消；
                        //auto_retry: 委托超过一定时间未成交，已由系统自动以不同价格发起新的委托; failed,失败
     * @returns {Boolean} 是否成功
     * @private
     */
    async refreshOrder(order,apiOrder,refreshAccount = false){
        //{outerId: "423425", //挂单ID
        //datetime: new Date(),  //挂单时间
        //type: "buy",  //类型（buy, sell）
        //price: 100,  //挂单价格(单位为分)
        //amount: 12, //成交数量
        //totalAmount: 20, //挂单数量 
        //status: 'canceled'}  

        //同步委托状态，碰到失败的或者是委托在一定时间(10分钟)后未交易的，根据市场价格重新提交一个委托
        //if(['success','canceled','auto_retry','failed'].indexOf(order.status) != -1){
        //    //todo 因为获取的是外部网站的status为open的委托，
        //    //此时，应该是系统出问题了，最好记录下以便排查
        //    continue; 
        //}

        let orderStatus = order.status;
        if(apiOrder.status == 'canceled'){
            orderStatus = 'canceled';
        } else if(apiOrder.status == 'consign'){
            orderStatus = (apiOrder.bargainAmount > 0 ? 'part_success' : 'consign');
        } 
        // else if(apiOrder.status == 'closed'){
        //     let leftAmt = new Decimal(apiOrder.totalAmount).minus(apiOrder.bargainAmount).toNumber();
        //     orderStatus = leftAmt > 0 ? 'canceled' : 'success'; //如果有未成交的部分，则为'canceled',否则为success
        // }  

        let realAmount = this.getRealAmount(apiOrder.amount,apiOrder.price || apiOrder.avgPrice,apiOrder.symbol,apiOrder.unit);
        let realDealAmount = this.getRealAmount(apiOrder.dealAmount,apiOrder.avgPrice || apiOrder.price,apiOrder.symbol,apiOrder.unit);
        if(refreshAccount){
            let changeType, //需要更改帐户的原因类型。为空时表示没有更改
                changeAmount = new Decimal(realDealAmount).minus(order.bargainAmount).toNumber(); //更改帐户的金额
            if(changeAmount > 0){ //委托被交易
                changeType = 'bargain';
            }

            if(orderStatus == 'canceled'){ //委托被取消
                changeType = 'cancel';
            } 

            let options = {
                userName: order.userName, 
                symbol: order.symbol,
                side: order.side,
                leverage: order.leverage || 1,
                site: order.site, 
                price: order.price, 

                amount: realAmount,
                consignAmount: realAmount,
                bargainAmount: realDealAmount,
                bargainChangeAmount: changeAmount
            };
            await account.refreshAccountTrading(options, changeType);
        }
            
        order.consignAmount = realAmount;
        order.bargainAmount = realDealAmount;
        order.status = apiOrder.status;
        order.modified = new Date();
        let newOrder = await order.save();
        
        return newOrder
    }


    /**
     * 获取在交易平台中某个交易品种，被使用货币可以使用的数量
     *
     * @param 
     */
    async getAvailableAmount(symbol,site,side){
        //todo
        return 0;
    }


    async _getIdentifier(order){
        let identifier = await clientIdentifier.getUserClient(order.userName,order.site); 
        return identifier;
    }
}

module.exports = new OrderController();