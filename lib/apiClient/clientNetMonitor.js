'use strict';
const ExpiredData_Inteval = 30 * 1000; //多少毫秒没有接收到pong数据后，被认为网络中断

let clientNetMonitor = new class {
    constructor(){
        this.sitesPongMap = new Map();  //key: site, 
                                        //value: [{ 
                                        //  clientType: 'futures', //client类型。spot/futures
                                        //  timestamp: 23432432,   //上次收到pong包的时间戳
                                        //  type: "auth-pong"      //pong类型。 pong/auth-pong
                                        //}]
        this.checkSitesIntervals = []; //key:site-clientType,value: Function
    }

    /**
     * 启动检测
     * @public
     */
    pushPongItem(pongItem){
        this.upsertPongItem(pongItem);
    }

    /**
     * 检测网络是否正常
     * @param {*} site 
     * @param {*} clientType client/futuresClient
     * @param {*} pongType pong/auth-pong
     * @public
     */
    checkNormal(site,clientType,pongType){
        //如果登录授权操作失败，则重新发起连接
        let pongItem = this.getPongItem(site,clientType,pongType);
        if(!pongItem){
            return false;
        }
        
        let isNormal = !this.checkPongExpired(pongItem);
        // if(!isNormal){
        //     let  i = 1;
        // }
        return isNormal;
    }

    /**
     * 判断是否过期
     * @param {*} site 
     * @param {*} type 
     * @param {*} pongItem 
     * @private
     */
    checkPongExpired(pongItem){
        return (pongItem.timestamp < +new Date() - ExpiredData_Inteval);
    }

    upsertPongItem(pongItem){
        let mapItem = this.sitesPongMap.get(pongItem.site);
        pongItem.timestamp = pongItem.timestamp || +new Date();
        if(!mapItem){
            this.sitesPongMap.set(pongItem.site,pongItem);
        } else {
            let oldPongItem = this.getPongItem(pongItem.site,pongItem.clientType,pongItem.type);
            if(oldPongItem){
                oldPongItem.timestamp = pongItem.timestamp;
            } else {
                mapItem.value = mapItem.value || [];
                mapItem.value.push(pongItem);
            }
        }
    }

    getPongItem(site,clientType,pongType){
        let mapItem = this.sitesPongMap.get(site);
        if(!mapItem){
            return null;
        }
        mapItem.value = mapItem.value || [];
 
        let pongItem = null;
        for(let item of mapItem.value){
            if(item.clientType == clientType && item.type == pongType){
                pongItem = item;
                break;
            }
        }

        return pongItem;
    }
}();

module.exports = clientNetMonitor;