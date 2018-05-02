'use strict';

class Test{
    constructor(identifier){
        
    }

    cry(){
        var strategy = {
    
            condition: String,
            operates: [{
                id: Number,
                site: String, //平台名称

                side: String, //buy或sell
                symbol: String, //cny、btc、ltc、usd

                previousOperate: { type: Number, default: 0 },
                nextOperate: { type: Number, default: 0 },
                bargainAmount: String 
            }]
        };

        console.log('test.cry');
    }

}

module.exports = Test
