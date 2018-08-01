'use strict';

const database = require('../database');
const customConfig = require('../../config/customConfig');
const mongoose = require('mongoose');
const Graph = require('../utils/graph');
const debug = require('debug')('analog:transferStrategys:trialMarketSymbol');

const Decimal = require('decimal.js'),
    request = require('supertest'),
    assert = require('assert'),
    co = require('co'),
    fs= require('fs'),
    path = require('path'),
    realTimePrice = require('../realTimePrice'),
    positionLib = require('../position'),
    symbolUtil  = require('../utils/symbol');

let trialMarketSymbol = new class{

    /**
     * 获取SymbolPathPairs
     * @param {*} siteGroupA 网站A的行情深度 e.g { site: "baidu", contractType: 'spot',depths: [{symbol: "btc#usd",bids:[],asks:[]}]}
     * @param {*} siteGroupB 网站B的行情深度 e.g { site: "baidu",contractType: 'futures',depths: [{symbol: "btc#usd",bids:[],asks:[]}]}
     * @param {*} depths 
     * @returns {Array} e.g {siteA: 'baidu', siteB: 'qq',symbolPathA: [{symbol: "bch#btc",reverse: false}],symbolPathB: [] }
     */
    getSymbolPathPairs(siteGroupA,siteGroupB){
        let symbolPathPairs = [],
            pathPairs = this.getPathPairs(siteGroupA,siteGroupB);

        for(let i = 0; i < pathPairs.length; i++){
            let pathPair = pathPairs[i];
            let symbolsA_info = this._getSymbolPath(pathPair.pathA,siteGroupA);
            if(!symbolsA_info.isSuccess){
                return { isSuccess: false, message: symbolsA_info.message };
            }

            let symbolsB_info = this._getSymbolPath(pathPair.pathB,siteGroupB);
            if(!symbolsB_info.isSuccess){
                return { isSuccess: false, message: symbolsB_info.message };
            }

            //symbolPath: { symbol: "btc#usd",reverse: false }
            if(!this.isReverseSymbolPath(symbolsA_info.symbolPath,symbolsB_info.symbolPath)){
                debug(`错误的路径对。${JSON.stringify(pathPair)}`)
            }
        
            let symbolPathPair = {
                siteA: pathPair.siteA,
                siteB: pathPair.siteB,
                contractTypeA: pathPair.contractTypeA,
                contractTypeB: pathPair.contractTypeB,
                symbolPathA: symbolsA_info.symbolPath,
                symbolPathB: symbolsB_info.symbolPath
            };
            symbolPathPairs.push(symbolPathPair);
        }

        return { isSuccess: true, symbolPathPairs: symbolPathPairs };
    }

    isReverseSymbolPath(symbolPathA,symbolPathB){
        let sourceCoinA, targetCoinA,
            sourceCoinB, targetCoinB;

        let symbolPartsA_first = symbolUtil.getSymbolParts(symbolPathA[0].symbol);
        sourceCoinA = symbolPathA[0].reverse ? symbolPartsA_first.targetCoin : symbolPartsA_first.settlementCoin;
        let symbolPartsA_last = symbolUtil.getSymbolParts(symbolPathA[symbolPathA.length - 1].symbol);
        targetCoinA = symbolPathA[symbolPathA.length - 1].reverse ? symbolPartsA_last.settlementCoin : symbolPartsA_last.targetCoin;

        let symbolPartsB_first = symbolUtil.getSymbolParts(symbolPathB[0].symbol);
        sourceCoinB = symbolPathB[0].reverse ? symbolPartsB_first.targetCoin : symbolPartsB_first.settlementCoin;
        let symbolPartsB_last = symbolUtil.getSymbolParts(symbolPathB[symbolPathB.length - 1].symbol);
        targetCoinB = symbolPathB[symbolPathB.length - 1].reverse ? symbolPartsB_last.settlementCoin : symbolPartsB_last.targetCoin;

        return (sourceCoinA == targetCoinB && targetCoinA == sourceCoinB);
    }

    /**
     * 获取反转的symbolPathPair
     * @param {Object} symbolPathPair e.g {siteA: 'baidu', siteB: 'qq',symbolPathA: [{symbol: "bch#btc",reverse: false}],symbolPathB: [] }
     */
    getReverseSymbolPathPair(symbolPathPair){
        let reversePair = {
            siteA: symbolPathPair.siteA,
            siteB: symbolPathPair.siteB,
            symbolPathA: this.getReverseSymbolPath(symbolPathPair.symbolPathA),
            symbolPathB: this.getReverseSymbolPath(symbolPathPair.symbolPathB)
        };
        
        return reversePair;
    }

    getReverseSymbolPath(symbolPath){
        let reversePath = [];
        for(let j = symbolPath.length - 1; j >=0; j--){
            let item = symbolPath[j];
            let reverseItem = {
                symbol: item.symbol,
                reverse: !item.reverse
            }
            reversePath.push(reverseItem);
        }

        return reversePath;
    }

    /**
     * 根据策略的coin路径获取到交易品种symbol路径
     * 
     * @param {String} path,coin路径，e.g ['btc','bch','eos']
     * @param {Object} siteDepths，某一个网站的市场行情信息 e.g [{ site:"baidu",symbol: "btc#usd",bids[],asks:[]}]
     * @returns {Object} e.g  
     *   {isSuccess: true, 
     *    symbolPath: [{ symbol: "bch#btc",reverse: false},{ symbol: "bch#eos", reverse: true}] } 
     */
    _getSymbolPath(path,siteDepths){
        let symbolPath = [], settlementCoin = path[0],targetCoin;
        for(let  i = 1; i < path.length; i++){
            targetCoin = path[i];

            let found = false
            for(let p of siteDepths.depths){
                let symbolParts = symbolUtil.getSymbolParts(p.symbol);

                //如果需要将btc置换成bch（btc -> bch）
                //a.如果交易网站中存在bch#btc
                if(symbolParts.settlementCoin == settlementCoin && symbolParts.targetCoin == targetCoin){
                    symbolPath.push({ symbol: p.symbol,reverse: false });
                    found = true;
                    break;
                }

                //b.如果交易网站中存在btc#bch
                if(symbolParts.settlementCoin == targetCoin && symbolParts.targetCoin == settlementCoin){
                    symbolPath.push({ symbol: p.symbol,reverse: true });
                    found = true;
                    break;
                }
            }

            if(!found){
                //c.如果a、b两种交易品种都不存在
                return { isSuccess: false, message: `不存在网站${siteDepths.site}的交易品种${targetCoin}/${settlementCoin}或${settlementCoin }/${targetCoin}`}
            }

            settlementCoin = targetCoin;
        }

        return { isSuccess: true, symbolPath: symbolPath };
    }

    /**
     * 获取两个网站各自的兑换路径
     * 
     * @param {Object} siteGroupA e.g { site: "baidu", contractType: 'spot', depths: [{symbol: "btc#usd",bids:[],asks:[]}]}
     * @param {Object} siteGroupB e.g { site: "qq",contractType: 'futures', depths: [{symbol: "btc#usd",bids:[],asks:[]}]}
     * @returns {Array} e.g [{siteA: "baidu",pathA: ["btc","usd","eos"], siteB: "qq",pathB: ["btc","eos"]}]
     */
    getPathPairs(siteGroupA,siteGroupB,maxPathsNodeCount = 5){
        let graphA,graphB,
            nodesA = [],nodesB = [], //e.g ['btc','usd','eos']
            edgesA = [],edgesB = [], //e.g [['btc','usd'],['eos','usd']]
            pathsA,pathsB,
            depthsA = siteGroupA.depths,depthsB = siteGroupB.depths;
        
        //获取图的边和节点
        for(let depthA of depthsA){
            let symbolPartsA = symbolUtil.getSymbolParts(depthA.symbol);
            if(nodesA.indexOf(symbolPartsA.targetCoin) == -1){
                nodesA.push(symbolPartsA.targetCoin);
            }
            if(nodesA.indexOf(symbolPartsA.settlementCoin) == -1){
                nodesA.push(symbolPartsA.settlementCoin);
            }
            edgesA.push([symbolPartsA.targetCoin,symbolPartsA.settlementCoin]);
        }

        for(let depthB of depthsB){
            let symbolPartsB = symbolUtil.getSymbolParts(depthB.symbol);
            if(nodesB.indexOf(symbolPartsB.targetCoin) == -1){
                nodesB.push(symbolPartsB.targetCoin);
            }
            if(nodesB.indexOf(symbolPartsB.settlementCoin) == -1){
                nodesB.push(symbolPartsB.settlementCoin);
            }
            edgesB.push([symbolPartsB.targetCoin,symbolPartsB.settlementCoin]);
        }

        if(nodesA.length == 0 || nodesB.length == 0){
            return [];
        }

        //初始化图
        graphA = new Graph(nodesA.length);
        graphB = new Graph(nodesB.length);

        for(let edge of edgesA){
            graphA.addEdge(edge[0], edge[1]);
        }
        for(let edge of edgesB){
            graphB.addEdge(edge[0], edge[1]);
        }

        //从节点1到节点2的所经过的边数 <=2 的全部路径，每个网站分开计算
        let start = +new Date(),end;
        for(let node1 of nodesA){
            for(let node2 of nodesA){
                if(node1 == node2){
                    continue;
                }
                graphA.initPathsTo(node1, node2);
            }
        }
        pathsA = graphA.paths.filter(v => v.length <= 3);
        end = +new Date();
        console.log(`计算pathsA所花时间${end - start}`)
        
        start = +new Date()
        for(let node1 of nodesB){
            for(let node2 of nodesB){
                if(node1 == node2){
                    continue;
                }
                graphB.initPathsTo(node1, node2);
                //pathsB = graphB.paths.filter(v => v.length <= 3);
            }
        }
        pathsB = graphB.paths.filter(v => v.length <= 3);
        end = +new Date();
        console.log(`计算pathsA所花时间${end - start}`)

        let pathPairs = [];
        //计算两个网站可以做差价的路径，需要满足两个条件
        //（1）两个网站同时存在从节点A到节点B的路径
        //（2）每个网站的边数都不能大于2
        for(let pathA of pathsA){
            let arrPathB = pathsB.filter(v => v[0] == pathA[0] && v[v.length - 1] == pathA[pathA.length - 1]);
            if(arrPathB.length > 0){
                for(let pathB of arrPathB){
                    if(pathA.length + pathB.length > maxPathsNodeCount){
                        continue;
                    }

                    pathPairs.push({
                        siteA: siteGroupA.site,
                        contractTypeA: siteGroupA.contractType,
                        pathA: pathA,

                        siteB: siteGroupB.site,
                        contractTypeB: siteGroupB.contractType,
                        pathB: pathB
                    });
                }
            }
        }

        //去掉重复的路径
        let copyPathPairs = [];
        for(let p of pathPairs){
            if(this._hasIncludeCoin('etc#eth',p)){
                let iiii = 0;
            }

            let hasRelative = false;
            for(let i = 0; i < copyPathPairs.length; i++){
                let q = copyPathPairs[i];
                hasRelative = this.isRelativePathPair(p,q);
                if(hasRelative){
                    break;
                }
            }

            if(!hasRelative){
                //将pathsB反转，方便后面差价计算
                if(!this.isReversePath(p.pathA,p.pathB)){
                    p.pathB.reverse();
                    copyPathPairs.push(p);
                } else {
                    copyPathPairs.push(p);
                }
            }
        }

        return copyPathPairs;
    }

    _hasIncludeCoin(coin,pathPair){
        let isSymbol = coin.indexOf('#') != -1;
         
        let hasInclude = false;
        if(isSymbol){
            let symbolPart = symbolUtil.getSymbolParts(coin);
            hasInclude = (symbolPart.targetCoin == pathPair.pathA[0] && symbolPart.settlementCoin == pathPair.pathA[pathPair.pathA.length - 1]) || 
                          (symbolPart.settlementCoin == pathPair.pathA[0] && symbolPart.targetCoin == pathPair.pathA[pathPair.pathA.length - 1]);
            if(!hasInclude){
                hasInclude = (symbolPart.targetCoin == pathPair.pathB[0] && symbolPart.settlementCoin == pathPair.pathB[pathPair.pathB.length - 1]) || 
                            (symbolPart.settlementCoin == pathPair.pathB[0] && symbolPart.targetCoin == pathPair.pathB[pathPair.pathB.length - 1]);
            }
        } else {
            hasInclude = (pathPair.pathA.indexOf(coin) != -1);
            if(!hasInclude){
                hasInclude = (pathPair.pathB.indexOf(coin) != -1);
            }
        }

        return hasInclude;
    }

    isRelativePathPair(pathPair1,pathPair2){
        return (this.isRelativePath(pathPair1.pathA,pathPair2.pathA) && this.isRelativePath(pathPair1.pathB,pathPair2.pathB)) 
            || (this.isRelativePath(pathPair1.pathA,pathPair2.pathB) && this.isRelativePath(pathPair1.pathB,pathPair2.pathA));
    }

    isRelativePath(path1,path2){
        return this.isFullSamePath(path1,path2) || this.isFullReversePath(path1,path2) ;
    }

    isFullSamePath(path1,path2){
        if(path1.length != path2.length){
            return false;
        }

        let isSame = true;
        for(let i = 0; i < path1.length; i++){
            if(path1[i] != path2[i]){
                isSame = false;
                break;
            }
        }
       
        return isSame;
    }

    isReversePath(path1,path2){
        return (path1[0] == path2[path2.length - 1] && path1[path1.length - 1] == path2[0]);
    }

    isFullReversePath(path1,path2){
        if(path1.length != path2.length){
            return false;
        }

        let isReverse = true;
        for(let i = 0; i < path1.length; i++){
            if(path1[i] != path2[path2.length - i - 1]){
                isReverse = false;
                break;
            }
        }

        return isReverse;
    }

    log(data){
        fs.appendFile(path.join(__dirname,'logs',  'asset_log.txt'), JSON.stringify(data) + '\r\n\r\n', (err) =>  {
            if (err) throw err;
            //console.log("Export Account Success!");
        });
    }

    clearLogs(){
        let dir = path.join(__dirname,'logs');
        fs.readdirSync(dir).forEach(function(item){
            let stat = fs.lstatSync(path.join(dir, item));
            if(stat.isDirectory()){
                return;
            }
            fs.unlinkSync(path.join(dir, item));
        });
    }

    getTestItems(){
        let items = [
            {
                site: "1",
                symbol: "eos#btc",
                coinsPair: "",
                dateCode: "",
                bids:[[1,1]],
                asks:[[1.1,1]],
            },{
                site: "2",
                symbol: "btc#usd",
                coinsPair: "",
                dateCode: "",
                bids:[[2,1]],
                asks:[[2.1,1]],
            },{
                site: "2",
                symbol: "eos#usd",
                coinsPair: "",
                dateCode: "",
                bids:[1.5,1],
                asks:[1.6,1],
            }
        ]

        return items;
    }

}();

module.exports = trialMarketSymbol;

