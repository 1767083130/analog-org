'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paginate = require('mongoose-paginate');

var StopLossLogModel = function () {
    const StopLossLogSchema = mongoose.Schema({
        userName: {type: String, required: true },
        site: {type: String, required: true },
        symbol: { type: String, required: true },
        isTest: { type: Boolean },
        //stopLossStepId: { type: Schema.ObjectId, required: true  },
        status: { type: String, "default": "wait" },  //status可能的值:wait,准备开始;delay,已被延迟;canceled,已被取消;
                                                      //consign,已委托交易
                                                      //success,成功执行; renew,已经被nextId的替换,不需要再执行
        nextId: { type: Schema.ObjectId }, //下一个StopLossLog的_id
        previousId: { type: Schema.ObjectId },

        /* 止损 */
        delayStart: {type: Date }, //止损开始等待的起点时间
        orderId: { type: Schema.ObjectId }, //止损下单的交易Id
  
        /* 移动止损 */
        currentLoss: { type: Number }, //当前止损价格。为幅度，比如5，表示5%
       
        /* 强制执行止损 */
        forceStopStart: { type: Date }, //止损开始等待的起点时间
        forceStopOrderId: {  type: Schema.ObjectId  },

        /* 止损后重新上涨，弥补止损错误 */
        reverseOrderId: { type: Schema.ObjectId }, //止损下单的交易Id

        /* 止损顺势做多失败后，强制执行 */
        forceReverseStart: { type: Date },
        forceReverseOrderId: {  type: Schema.ObjectId  },
        stopLossStep: { type: Schema.Types.Mixed }, //关联的StopLoss.Step

        expired: { type: Date },  //过期日期
        lastRunTime: { type: Date },  //上次运行时间
        created: { type: Date, "default": Date.now() },
        modified: { type: Date, "default": Date.now() }
    });

     /**
     * Methods
     */
    StopLossLogSchema.methods = {

    }
    
    /**
     * Statics
     */
    StopLossLogSchema.statics = {

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
        
        getRunningLogs: function(){
            return this.find({  
                $in:{ status: ['canceled','success','renew','retrade'] },
                $gte: { expired: Date.now }
            }).exec();
        }

    };

    StopLossLogSchema.plugin(paginate);
    return mongoose.model('StopLossLog', StopLossLogSchema);
};


module.exports = new StopLossLogModel();
