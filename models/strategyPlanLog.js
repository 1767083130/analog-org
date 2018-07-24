'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var strategyPlanLogModel = function () {
    const StrategyPlanLogSchema = mongoose.Schema({
        userName: { type: String, required: true }, 
        name: { type: String, required: true }, 
        desc:  { type: String }, 
        strategys: [{ 
            strategyId: { type: Schema.ObjectId,ref: "TransferStrategy" },  
            consignAmount: { type: Number,default: 0,min: 0 }, //已执行委托但尚未完成的数量.必须为大于0的数
            actualAmount: { type: Number,default: 0,min: 0 }, //已执行完成的数量.必须为大于0的数
        }],
        
        planId: { type: Schema.ObjectId,required: true  }, 
        isValid: { type: Boolean, default: true },
        isSimple: { type: Boolean, default: false },  //是否为简单模式
        status: { type: String } , //可能的值：init、 wait、 running、success、 stopped
        
        stepAmount: { type: Number,required: true },  //每步执行数量
        totalAmount: { type: Number,required: true }, //需要执行总量。 -1，表示直到满仓为止

        lastRunTime: Date, //上次执行时间
        interval: { type: Number}, //两次执行的间隔时间，单位为ms

        startTime: Date,
        endTime: Date,
        created: { type : Date, "default": Date.now() },
        modified: { type : Date, "default": Date.now() }
    },{
        usePushEach: true
    });

     /**
     * Methods
     */
    StrategyPlanLogSchema.methods = {
    }
    
    /**
     * Statics
     */
    StrategyPlanLogSchema.statics = {

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
        getUserStrategyPlanLogs: function(userName){
            return this.findOne({ userName: userName,isValid: true }).exec();
        }
    };

    StrategyPlanLogSchema.plugin(paginate);
    return mongoose.model('StrategyPlanLog', StrategyPlanLogSchema);
};


module.exports = new strategyPlanLogModel();

