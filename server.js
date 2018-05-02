'use strict';
const app = require('./index');
const http = require('http');

//Expose
module.exports = app;

//Create and start HTTP server.
let server = http.createServer(app);
server.listen(process.env.PORT || 4000);
server.on('listening', function () {
    console.log('Server listening on http://localhost:%d', this.address().port);
});

process.on('uncaughtException', function(e) {
    console.log(e);
});
