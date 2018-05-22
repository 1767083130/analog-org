'use strict';
const Client = require('../Client');
const debug = require('debug')('ws-server:clientDemo');
const Server_Url = 'ws://119.28.204.125/ws'; //require('../config').ServerUrl;  

let client = new Client({
    appKey: 'a',
    appSecret: 'b',
    serverUrl: Server_Url
});
let channels = ['market','order','position','wallet']; 

//连接服务器并在成功后订阅消息通道
let errListener;
client.connect(function(e){
    console.log(`成功连接交易网站pkell`);
    // setInterval(function(){
    //     client.send({now: + new Date()});
    // },50)

    for(let site of ['okex','bitfinex']){
        for(let channel of channels){
            let options = {
                event: "addChannel",
                channel: channel,
                parameters: { site: site, symbol: '*' }
            };
            client.send(options);
        }
    }

    client.on('pong',function(){
        console.log(`${site} ${type} pong`);
    }.bind(this));

    //处理返回的数据
    client.on('message', function(res){ 
        //console.log(JSON.stringify(res));
        switch(res.channel){
        case 'order':
            //console.log(JSON.stringify(res));
            break;
        // case 'position':
        //     this.positions_reached(res);
        //     break;
        // case 'market':
        //     this.market_reached(res);
        //     break;
        // case 'wallet':
        //     this.wallet_reached(res);
        //     break;
        }
    }.bind(this));

    //有可能是在重新连接的时候触发connect事件，这时先前注册的错误处理事件已经失效，需要重新注册
    client.off('error',errListener);
    client.on('error', _onSocketError.bind(this));
}.bind(this));

//有可能在没有连接成功前触发错误，这时也需要进行错误处理
client.on('error',errListener = _onSocketError.bind(this));

function _onSocketError(err){
  if(err.message || err.stack){
      console.error(`${this.site} ${this.type} 出错啦! ` + err.message + '\n' + err.stack);
   } else {
      console.error(`${this.site} ${this.type} 出错啦! ` +  JSON.stringify(err));
   }
}
