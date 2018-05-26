'use strict';

const Decimal = require('decimal.js');

let common = new class{

    getRealOrderAmount(orderAmount,accountAmount){
        if(orderAmount.indexOf('%') == -1){
            let num = parseFloat(orderAmount);
            if(!isNaN(num) && isFinite(num)){
                return Math.min(num,accountAmount);
            }
        } else {
            let s = orderAmount.substring(0,orderAmount.length - 1);
            let percent = parseFloat(s);
            if(!isNaN(percent) && isFinite(percent)){
                let num = accountAmount * percent / 100;
                return Math.min(num,accountAmount);
            }
        }

        return 0;
    }

    fixCoinAmount(amount){
        let obj;
        if(typeof amount != 'object'){
            obj  = new Decimal(amount);
        } else { //被认为是Decimal对象
            obj = amount;
        }

        return obj.toDP(4, Decimal.ROUND_DOWN).toNumber();
    }

    fixPrice(price){
        let obj;
        if(typeof price != 'object'){
            obj  = new Decimal(price);
        } else { //被认为是Decimal对象
            obj = price;
        }

        return obj.toDP(2, Decimal.ROUND_DOWN).toNumber();
    }
    
    getServiceUrl(apiUrl) {
        return '/DesktopModules/Services/Api' + apiUrl;
    }

    getMainDomain() {
        var isTest = this.isTest();
        if (isTest) {
            return "http://localhost"; //TODO 这里测试先改为www.360yee.com
        }
        else
        {
            return "http://www.tkell.cn";
        }
    }
}();

module.exports = common;