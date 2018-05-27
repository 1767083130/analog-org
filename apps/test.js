var showMem = function() {
	var mem = process.memoryUsage();
	var format = function(bytes) {
		return (bytes/1024/1024).toFixed(2)+'MB';
	};
	console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
};
function add(){
	for(var i = 0 ; i < 10000; i++){
        //process.nextTick(function () {});
        setImmediate(function(){});
		//setTimeout(function(){},0)
	}	
}
console.log("------------------------------------ ")
add();
setInterval(function(){
	showMem()
}, 1000);
setInterval(add, 2000);