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
     * @returns e.g {siteA: 'baidu', siteB: 'qq',symbolPathA: [{symbol: "bch#btc",reverse: false}],symbolPathB: [] }
     */
    getSymbolPathPairs(siteGroupA,siteGroupB){
        let symbolPathPairs = [],
            pathPairs = this.getPathPairs(siteGroupA,siteGroupB);

        for(let pathPair of pathPairs){
            let symbolsA_info = this._getSymbolPath(pathPair.pathA,siteGroupA);
            if(!symbolsA_info.isSuccess){
                return { isSuccess: false, message: symbolsA_info.message };
            }

            let symbolsB_info = this._getSymbolPath(pathPair.pathB,siteGroupB);
            if(!symbolsB_info.isSuccess){
                return { isSuccess: false, message: symbolsB_info.message };
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
    getPathPairs(siteGroupA,siteGroupB){
        let graphA,graphB,
            nodesA = [],nodesB = [], //e.g ['btc','usd','eos']
            edgesA = [],edgesB = [], //e.g [['btc','usd'],['eos','usd']]
            pathsA,pathsB,
            depthsA = siteGroupA.depths,depthsB = siteGroupB.depths;
        
        //获取图的边和节点
        for(let depthA of depthsA){
            let symbolPartsA = symbolUtil.getSymbolParts(depthA.symbol);
            nodesA.push(symbolPartsA.targetCoin);
            nodesA.push(symbolPartsA.settlementCoin);
            edgesA.push([symbolPartsA.targetCoin,symbolPartsA.settlementCoin]);
        }

        for(let depthB of depthsB){
            let symbolPartsB = symbolUtil.getSymbolParts(depthB.symbol);
            nodesB.push(symbolPartsB.targetCoin);
            nodesB.push(symbolPartsB.settlementCoin);
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

        // let strA = graphA.showGraph();
        // console.log("graphA:");
        // console.log(strA);

        // let strB = graphB.showGraph();
        // console.log("graphB:");
        // console.log(strB);

        //从节点1到节点2的所经过的边数 <=2 的全部路径，每个网站分开计算
        for(let node1 of nodesA){
            for(let node2 of nodesA){
                if(node1 == node2){
                    continue;
                }
                graphA.initPathsTo(node1, node2);
                pathsA = graphA.paths.filter(v => v.length <= 3);
            }
        }

        for(let node1 of nodesB){
            for(let node2 of nodesA){
                if(node1 == node2){
                    continue;
                }
                graphB.initPathsTo(node1, node2);
                pathsB = graphB.paths.filter(v => v.length <= 3);
            }
        }

        let pathPairs = [];
        //计算两个网站可以做差价的路径，需要满足两个条件
        //（1）两个网站同时存在从节点A到节点B的路径
        //（2）每个网站的边数都不能大于2
        for(let pathA of pathsA){
            let arrPathB = pathsB.filter(v => v[0] == pathA[0] && v[v.length - 1] == pathA[pathA.length - 1]);
            if(arrPathB.length > 0){
                for(let pathB of arrPathB){
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
            let hasRelative = false;
            for(let q of copyPathPairs){
                hasRelative = this.isRelativePathPair(p,q);
                if(hasRelative){
                    break;
                }
            }

            if(!hasRelative){
                //将pathsB反转，方便后面差价计算
                p.pathB = p.pathB.reverse();
                copyPathPairs.push(p);
            }
        }

        return copyPathPairs;
    }

    isRelativePathPair(pathPair1,pathPair2){
        return (this.isRelativePath(pathPair1.pathA,pathPair2.pathA) && this.isRelativePath(pathPair1.pathB,pathPair2.pathB)) 
            || (this.isRelativePath(pathPair1.pathA,pathPair2.pathB) && this.isRelativePath(pathPair1.pathB,pathPair2.pathA));
    }

    isRelativePath(path1,path2){
        return this.isSamePath(path1,path2) || this.isReversePath(path1,path2) ;
    }

    isSamePath(path1,path2){
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

