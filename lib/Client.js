'use strict';
var EventEmitter = require('eventemitter2').EventEmitter2;
var WebSocket = require('ws');
var md5 = require('MD5');
var util = require('util');
var debug = require('debug')('Client:realtime-api');

const SITE_NAME = 'pkell';
const Server_Url = 'ws://119.28.204.125/ws';

/**
 * 构造函数 
 * 
 * @param {Object} options 
 * @param {String} options.appKey 
 * @param {String} options.appSecret
 * @param {Boolean} [options.autoReconnect] 是否自动连接
 * @param {Number} [options.autoReconnectInterval] 自动连接间隔时间 
 * @param {Array} [options.channels]  选填。需要订阅的消息
 */
function Client(options) {
    EventEmitter.call(this, {
        wildcard: true,
        delimiter: ':',
        maxListeners: Infinity
    });

    options = options || {};
    this.options = options;

    this._autoReconnect = options.autoReconnect !== false
    this._autoReconnectInterval = options.autoReconnectInterval || 2 * 1000; // ms
    this._isReconnecting = false;
    this._isClosing = false
    this._isOpen = false;
    this._ws = null;
    this._openCallback = null;
 
    this.pingTimer = null;
    this.site = SITE_NAME;

    //var socketURL,site;
    this.socketURL = this.options.serverUrl || Server_Url;
}
util.inherits(Client, EventEmitter);

Client.prototype.connect = function(callback){
    // Initialize the socket.
    this._openCallback = callback;
    this._ws = this._createSocket(callback);
    if (this.options.appKey) {
        this.authenticated = true;
    }
}

/**
 * 发送命令
 * 
 * @param {Object} data 发送的数据
 * @param {String} data.event 可能的值，addChannel(注册请求数据)/removeChannel(注销请求数据)/push(提交数据) 
 * @param {String} data.channel 可能的值, order(表示下单交易)/market(市场价格)/position（仓位）/wallet(账户信息)
 * @param {Object} data.parameters  一些参数，比如{ appKey: "a",appSecret: "b", amount: 123,price: 234}
 * @param {Boolean} [checkState],是否发送时检测连接状态。如果为true时，如果连接状态不是正常连接状态，
 *                         则等待连接成功后再次发送；为false时，不检测状态直接发送
 * @public
 */
Client.prototype.send = function (data,checkState,callback) {
    if(typeof checkState == 'function'){
        callback = checkState;
        checkState = false;
    }

    let _send = function(){
        let params = data.parameters ? data.parameters : {};
        params['api_key'] = this.options.appKey;
        params['sign'] = sign(params, this.options.appSecret);

        let newData = { parameters: params };
        if(data.event){
            newData.event = data.event;
        }
        if(data.channel){
            newData.channel = data.channel;
        }

        this._ws.send(JSON.stringify(newData));

        // if(callback && data.channel){
        //     this.on(data.channel,callback);
        // }
    }.bind(this)

    if (checkState && this._ws.readyState != WebSocket.OPEN) {
        // Not open yet. Call this when open
        return this._ws.once('open', function() {
           _send();
        });
    } 
    _send();
}


Client.prototype.subscribe = function(channels,callback) {
	var data = [];
    var _subscribe = function(name){
        let data = {'event': 'addChannel','channel': name};
        this.send(data,false,callback);
    }.bind(this)

    if(typeof channels == 'string'){
        _subscribe(channels);
    } else {
        channels.forEach(function(name) {
            _subscribe(name);
        });
    }
}

Client.prototype._createSocket = function (callback) {
    let client = new WebSocket(this.socketURL);
    this._isReconnecting = false;

    client.on('open',function() {
        if(callback){
            callback();
        }

        client.opened = true;
        this.emit('open');

        this.pingTimer = setInterval(function () {
            if (this._ws.readyState == WebSocket.OPEN) {
                this.send({ 'event': 'ping' });
            }
        }.bind(this), 20000);
    }.bind(this));

    client.on('message', function(res,flags) {
        let json;
        try {
            json = JSON.parse(res);
        } catch (e) {
            this.emit('error', 'Unable to parse incoming data:', res);
            return;
        }
        
        var _fun = function(resItem){
            if(resItem.event && resItem.event == 'pong'){
                this.emit('pong');
                return;
            }

            if (resItem.error_code) return this.emit('error', resItem);
            //if (!resItem.data) return; // connection or subscription notice
            this.emit("message", resItem);
            if(resItem.channel){
                // if(resItem.channel == 'order'){ //todo
                //     console.log(JSON.stringify(resItem));
                // }
                this.emit(resItem.channel,resItem.data)
            }
        }.bind(this);

        if(Array.isArray(json)){
            for(let resItem of json){
                _fun(resItem);
            }
        } else {
            _fun(json);
        }
    }.bind(this));

    client.on('error',function (err) {
        debug('error: %j', err)
        if(err.code){
            switch (err.code) {
                case 'ECONNREFUSED':
                case 'ENOENT':
                case 'ETIMEDOUT':
                case 'ENOTFOUND':
                    client.readyState = WebSocket.CLOSED;
                    this.open = false;
                    if (this._autoReconnect && !this._isClosing && !this._isReconnecting) {
                        console.log(`正在尝试重新与网站pkell进行连接...`);
                        this.reconnect(err);
                    }

                    break;
                default:
                    break;
            }
        }

        var listeners = this.listeners('error');
        // If no error listeners are attached, throw.
        if (!listeners.length) {
            throw err;
        }
        else {
            this.emit('error', err);
        }
    }.bind(this));

    client.on('close',function(e){
        this._ws = null;
        console.log(`与网站${this.site}网络连接已断开：` + e);
        // switch (e) {
        // case 1000:  // CLOSE_NORMAL
        //     console.log(`${this.site} WebSocket: closed`);
        //     break;
        // default:    // Abnormal closure
        //     this.reconnect(e);
        //     break;
        // }
        if (this._autoReconnect && !this._isClosing) {
            this.reconnect(e);
        }

        this.emit('close', e);
    }.bind(this));

    return client;
};

Client.prototype.close = function(){
    if (!this._isOpen || this._ws === null) {
        return Promise.reject(new Error('not open'))
    }

    this._isClosing = true
    return new Promise((resolve, reject) => {
        this._ws.once('close', () => resolve())
        this._ws.close(code, reason)
    })
}

Client.prototype.reconnect = function (e) {
    console.log(`${this.site} WebSocketClient: retry in ${this._autoReconnectInterval} ms`);
    this._isReconnecting = true;
    if(this.pingTimer){
        clearTimeout(this.pingTimer);
    }

    setTimeout(function () {
        this._ws = this._createSocket(this._openCallback); //_createSocket
        this._isClosing = false
    }.bind(this), this._autoReconnectInterval);

};

function sign(params, secret) {
    return md5(stringifyToOKCoinFormat(params) + '&secret_key='+ secret).toUpperCase();
}

/* snippet from Client-API project */
function stringifyToOKCoinFormat(obj) {
    var arr = [],
    i,
    formattedObject = '';

    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            arr.push(i);
        }
    }
    arr.sort();
    for (i = 0; i < arr.length; i++) {
        if (i != 0) {
            formattedObject += '&';
        }
        formattedObject += arr[i] + '=' + obj[arr[i]];
    }
    return formattedObject;
}

function errorMessage(code) {
    var codes = {
        10001: 'Illegal parameters',
        10002: 'Authentication failure',
        10003: 'This connection has requested other user data',
        10004: 'This connection did not request this user data',
        10005: 'System error',
        10009: 'Order does not exist',
        10010: 'Insufficient funds',
        10011: 'Order quantity too low',
        10012: 'Only support btc_usd ltc_usd',
        10014: 'Order price must be between 0 - 1,000,000',
        10015: 'Channel subscription temporally not available',
        10016: 'Insufficient coins',
        10017: 'WebSocket authorization error',
        10100: 'user frozen',
        10216: 'non-public API',
        20001: 'user does not exist',
        20002: 'user frozen',
        20003: 'frozen due to force liquidation',
        20004: 'future account frozen',
        20005: 'user future account does not exist',
        20006: 'required field can not be null',
        20007: 'illegal parameter',
        20008: 'future account fund balance is zero',
        20009: 'future contract status error',
        20010: 'risk rate information does not exist',
        20011: 'risk rate bigger than 90% before opening position',
        20012: 'risk rate bigger than 90% after opening position',
        20013: 'temporally no counter party price',
        20014: 'system error',
        20015: 'order does not exist',
        20016: 'liquidation quantity bigger than holding',
        20017: 'not authorized/illegal order ID',
        20018: 'order price higher than 105% or lower than 95% of the price of last minute',
        20019: 'IP restrained to access the resource',
        20020: 'secret key does not exist',
        20021: 'index information does not exist',
        20022: 'wrong API interface',
        20023: 'fixed margin user',
        20024: 'signature does not match',
        20025: 'leverage rate error'
    }
    if (!codes[code]) {
        return 'Client error code: ' + code + 'is not supported';
    }

    return codes[code];
}

module.exports = Client;
