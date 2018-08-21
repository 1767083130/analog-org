'use strict';

process.on('uncaughtException', function(e) {
    console.error(e);
});

setInterval(function(){
    console.log('hello!');
},5000)