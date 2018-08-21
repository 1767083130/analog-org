'use strict';
const app = require('.');
const http = require('http');
const fs= require('fs');
const path = require('path');
const cacheClient = require('./lib/apiClient/cacheClient').getInstance();
const clientNetMonitor = require('./lib/apiClient/clientNetMonitor');
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

//Expose
module.exports = app;

let isServerStarted = false;
console.log('正在连接数据服务器...');

cacheClient.start(function(){
    console.log(`已成功连接数据服务器. ${cacheClient.options.serverUrl}`);
    
    if(!isServerStarted){
        //Create and start HTTP server.
        let server = http.createServer(app);
        let port = (NODE_ENV == 'production' ? 80 : 8090);
        server.listen(process.env.PORT || port);
        server.on('listening', function () {
            isServerStarted = true;
            console.log('Server listening on http://localhost:%d', this.address().port);
        });
    }
});


let client = cacheClient.getClient();
client.on('message', async function(res){ 
    switch(res.channel){
    case 'pong':
        //console.log(JSON.stringify(res));
        clientNetMonitor.pushPongItem(res.data);
        break;
    case 'position':
        //log(res);
        break;
    }
});

client.on('error', function (exc) {
    console.error(exc);
});

process.on('uncaughtException', function(e) {
    console.log(e);
});

function log(data){
    return
    fs.appendFile(path.join(__dirname,'logs',  'position.txt'), JSON.stringify(data) + '\r\n\r\n', (err) =>  {
        if (err) throw err;
        //console.log("Export Account Success!");
    });
}




