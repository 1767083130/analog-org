/**
 * A model for our account
 */
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var TransferStrategyLogModel = function () {
    const TransferStrategyLogSchema = mongoose.Schema({
        strategyId: { type: Schema.ObjectId,ref: "TransferStrategy" }, 
        strategyPlanLogId: { type: Schema.ObjectId,ref: "StrategyPlanLog" }, //执行计划Id
        userName: String,
        status: String, //wait,success,failed
        reason: String, //failed reason
        isTest: { type: Boolean },

        currentStep: Number,
        operates: [{
            orgOperate: { type: Schema.Types.Mixed },

            actionIds: [], //orderId or transferId
            //委托 -> 等待 -> 成交 -> 分批或不分批执行下一步
            //几种金额的关系 totalAmount >= consignAmount >= actualAmount >= undeal
            totalAmount: { type: Number }, //需要执行的总金额 
            undeal: { type: Number }, //这一步已经执行完成,但是下一步未处理的金额 
            consignAmount: { type: Number }, //委托金额
            actualAmount: { type: Number }, //实际转币或成交金额
            price: Number, //委托价格。当action=trade时有效
            status: String, //wait,success,failed,hand(等待人工处理),assign(已委托),part_success(部分成功)
            dibs: Number,  //用来判断是否成功而额外附加的零钱数额
            accountAmount: Number, //转币前的帐户总额。当action=transfer时有效
            errorMessage: String, //错误信息
            startTime: Date, //操作开始时间
            endTime: Date    //操作结束时间
        }],
        
        errorMessage: String,
        startTime: Date,
        endTime: Date,
        modified: { type : Date, "default": Date.now() }
    },{
        usePushEach: true
    });

     /**
     * Methods
     */
    TransferStrategyLogSchema.methods = {
    }
    
    /**
     * Statics
     */
    TransferStrategyLogSchema.statics = {

        /**
        * Find article by id
        *
        * @param {ObjectId} id
        * @api private
        */
        load: function (_id) {
            return this.findOne({ _id })
                .exec();
        },

        /**
         * 生成一个零数。零数的位数为minNum ~ maxNum之间，并且前面添加zeroNum个零
         */
        generateCoinDibsAmount: function(amount,coin){
            var minNum = 2,maxNum = 2, zeroNum = 0;
            if(coin == 'btc'){
                zeroNum = 1;
                minNum = 3;
                maxNum = 3;

                amount -= 0.1
            } else {
                amount -= 1;
            }

            amount += this.generateDibsAmount(minNum,maxNum,zeroNum);
            return amount;
        },

        /**
         * 生成一个零数。零数的位数为minNum ~ maxNum之间，并且前面添加zeroNum个零
         */
        generateDibsAmount: function(minNum,maxNum,zeroNum){
            var num = ((Math.random() * (maxNum - minNum) | 0) + minNum) //生成3~8之间的数
            var r = ((Math.random() * Math.pow(10,num)) | 0) / Math.pow(10,num + zeroNum);
            return r;
        }


    };

    TransferStrategyLogSchema.plugin(paginate);
    return mongoose.model('TransferStrategyLog', TransferStrategyLogSchema);
};


module.exports = new TransferStrategyLogModel();
