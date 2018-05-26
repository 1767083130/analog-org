cacheClient.start(function(){
    let client = cacheClient.getClient();
    //处理返回的数据
    client.on('message', async function(res){ 
        //console.log(JSON.stringify(res));
        switch(res.channel){
        case 'order':
            if(res.isSuccess){
                await onOrderMessage(res.data,res.site);
            }
            break;
        case 'trade':
            //console.log(JSON.stringify(res));
            break;
        }
    }.bind(this));

    client.on('pong',function(){
        console.log('pong');
    })

    if(NODE_ENV == 'production'){
        setInterval(runStrategys,INTERVAL);
        setInterval(renewOrders,INTERVAL);
    } else {
        setTimeout(runStrategys,INTERVAL);
        setTimeout(renewOrders,INTERVAL);
    }
});    