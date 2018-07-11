'use strict';
const app = require('./index');
const http = require('http');
const NODE_ENV = process.env.NODE_ENV || 'production'; //development

//Expose
module.exports = app;

//Create and start HTTP server.
let server = http.createServer(app);
let port = (NODE_ENV == 'production' ? 80 : 8090);
server.listen(process.env.PORT || port);
server.on('listening', function () {
    console.log('Server listening on http://localhost:%d', this.address().port);
});

process.on('uncaughtException', function(e) {
    console.log(e);
});