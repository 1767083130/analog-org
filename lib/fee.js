'use strict';

const apiConfigUtil  = require('./apiClient/apiConfigUtil');
const symbolUtil  = require('./utils/symbol');
const common = require('./common');
const ALL_FIXED = false;

let fee = new class {

    /**
     * 获取转币费用
     *
     * @param {String} site
     * @param {String} symbol
     */
    async getPayFee(site,coin){
        let platform = apiConfigUtil.getPlatform(site);
        let symbolItem = platform.coins.find(function(value){
            return value.coin == coin;
        });

        return symbolItem.payFee;
    }

    async getSettlementFee(site,symbol){
        let platform = apiConfigUtil.getPlatform(site);

        let symbolItem;
        if(platform && platform.symbols){
            symbolItem = platform.symbols.find(function(value){
                return value.symbol == symbol;
            });
        }

        if(!symbolItem){
            return 0;
        }
        
        return symbolItem.settlementFee || 0;
    }

    /**
     * 获取交易费用
     *
     * @param {String} express
     * @param {String} site
     * @param {String} symbol
     * @api public
     */
    async getTradeFee(express,site,symbol){
        var platform = apiConfigUtil.getPlatform(site);
        let symbolItem = platform.symbols.find(function(value){
            return value.symbol == symbol;
        });

        let fee = 0;
        if(symbolItem){
            fee = await this._getExpressFee(symbolItem.tradeFee,express);
        }

        return fee;
    }

    /**
     * 获取交易费用
     *
     * @api private
     */
    async _getExpressFee(info,express) {
        var itemsFixed = [];
        var expressParts = express.split('_');
        for (var key in info) {
            var itemParts = key.split('_');
            var isFixed = true;

            for (var i = 0; i < expressParts.length; i++) {
                if (itemParts.indexOf(expressParts[i]) == -1) {
                    isFixed = false;
                    break;
                }
            }

            if (isFixed && ((ALL_FIXED && expressParts.length == itemParts.length) || !ALL_FIXED)) {
                itemsFixed.push({ key: key, num: itemParts.length });
            }
        }

        itemsFixed.sort(function (a, b) {
            return a.num - b.num;
        });

        if (itemsFixed.length > 0) {
            return info[itemsFixed[0].key];
        }

        return 0;
    }

}();

module.exports = fee;