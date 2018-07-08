'use strict';
const app = require('./index');
const http = require('http');
const cacheClient = require('./lib/apiClient/cacheClient').getInstance();

//Expose
module.exports = app;

console.log('正在连接数据服务器...');
cacheClient.start(function(){
    console.log('已成功连接数据服务器.');
    
    //Create and start HTTP server.
    let server = http.createServer(app);
    server.listen(process.env.PORT || 80);
    server.on('listening', function () {
        console.log('Server listening on http://localhost:%d', this.address().port);
    });
});


let client = cacheClient.getClient();
// client.on('open',function(){
//     console.log(`已连接到服务器：${client.options.serverUrl}`)
//     let symbolDepths = cacheClient.getSymbolDepths(SITE,"btc#usd");
//     Output && log(symbolDepths)
// })

client.on('message',function(res){
    //Output && console.log(JSON.stringify(res));
    if(res.channel && res.channel != 'market'){
        //console.log(JSON.stringify(res));
    }
})

process.on('uncaughtException', function(e) {
    console.log(e);
});


// 'use strict';
// const app = require('./index');
// const http = require('http');

// //Expose
// module.exports = app;

// //Create and start HTTP server.
// let server = http.createServer(app);
// server.listen(process.env.PORT || 80);
// server.on('listening', function () {
//     console.log('Server listening on http://localhost:%d', this.address().port);
// });

// process.on('uncaughtException', function(e) {
//     console.log(e);
// });

