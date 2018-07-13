'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var StopLossModel = function () {
    const StopLossSchema = mongoose.Schema({
        userName: {type: String, required: true },
        symbol: String, //货币类型
        //priceSite: String, //价格参照的网站
        isTest: {type: Boolean,default:false},
        isValid: { type: Boolean,default: true },
        channel: { type: Number }, //运行通道。预留字段，客户不多，暂时没有必要实现 
        lastRunTime: { type: Date }, //最近一次运行时间 

        steps: [{
            /* 止损 */
            isValid: { type: Boolean,default: true },
            startPrice: { type: Number }, //止损和移动止损的起始参考价格  
            loss: Number, //止损价格。为幅度，比如5，表示5%
            position: { type:String, default: '100%' }, //数量，可以为20或10%这两种方式，默认为100%
            delay: { type: Number,default: 0 },  //等待时间。如果在等待的时间内已经上去，则不执行
            lossRange: { type:Number,default: 0 }, //止损容忍的偏差范围。为幅度，比如5，表示5%
            direction: { type: String,default: 'down' }, //分为两种，up、down
            operateType: { type: String, default: 'sell'}, //分为两种，buy、sell

            /* 移动止损 */
            trailingStop: Boolean,  //是否移动止损
            trailingRange: Number, //移动止损上移幅度
            
            /* 强制执行止损 */
            forceStop: { type: Boolean,default: false}, //当止损失败时，是否强制执行
            forceStopDelay: { type: Number,default: 0 }, //止损失败后等待的时间,单位为秒
            forceStopRange: Number,  //强制执行止损能容忍的价差

            /* 止损后重新上涨，弥补止损错误 */
            reverse:Boolean, //如果止损后重新上涨，是否顺势做多
            reverseRange: Number,  //上移幅度

            /* 止损顺势做多失败后，强制执行 */
            forceReverse: { type: Boolean,default: false}, //当顺势做多失败时，是否强制执行
            forceReverseDelay: { type: Number,default: 0 }, //顺势做多失败后等待的时间,单位为秒
            forceReverseRange: Number //能容忍的价差
        }],

        expired: { type: Date },
        created: { type: Date, "default": Date.now()},
        modified: { type : Date, "default": Date.now() }
    });

     /**
     * Methods
     */
    StopLossSchema.methods = {
    }
    
    /**
     * Statics
     */
    StopLossSchema.statics = {

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

        getStepOrderAmount: function(total,position){
            if(!total || !position){
                return 0;
            }

            let amount = 0;
            if(position.indexOf('%') != -1){
                let position = parseInt(position.replace('%',''));
                if(isNaN(position) || !isFinite(position)){
                    return 0;
                } 
                
                amount = total * position / 100;
            } else {
                amount = parseInt(position);
            }

            return amount;
        },

        getUserStopLosses: function(userName,options){
            if(!userName){
                throw new Error('参数userName不能为空');
            }

            let newOptions = Object.assign({},options,{ userName: userName});
            return this.find(newOptions)
                .exec();
        },

        getStopLoss(stepId){
            return this.aggregate(
                { $match: { "steps._id" : stepId } },
                { $unwind:"$steps" },
                { $match: { "steps._id": stepId } },
                { $group: { 
                    userName: "$userName", 
                    symbol: "$symbol", 
                    site: "$site",
                    steps: { $push: "$steps" } }}
            ).exec();
        }

    };

    return mongoose.model('StopLoss', StopLossSchema);
};


module.exports = new StopLossModel();
