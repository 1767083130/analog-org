'use strict';

let config = {
    serverUrl: "ws://119.28.204.125:8080/ws",
    platforms: [
        {
            site: "okex",
            autoTransfer: false,
            symbols: [
                /* NOTICE：因为"_"是系统保留字符，字段alias的交割日期部分使用“-”代替了交易网站中的"_",如“this_week”被替换成了"this-week" */
                { symbol: "btc#usd_1w", alias: "btc#usd_this-week", duration: "P5DT16H" },
                { symbol: "btc#usd_2w", alias: "btc#usd_next-week", duration: "P12DT16H" },
                { symbol: "btc#usd_1q", alias: "btc#usd_quarter", duration: "LPT16H" },

                { symbol: "ltc#usd_1w", alias: "ltc#usd_this-week", duration: "P5DT16H" },
                { symbol: "ltc#usd_2w", alias: "ltc#usd_next-week", duration: "P5DT16H" },
                { symbol: "ltc#usd_1q", alias: "ltc#usd_quarter", duration: "P5DT16H" },

                { symbol: "eth#usd_1w", alias: "eth#usd_this-week", duration: "P5DT16H" },
                { symbol: "eth#usd_2w", alias: "eth#usd_next-week", duration: "P5DT16H" },
                { symbol: "eth#usd_1q", alias: "eth#usd_quarter", duration: "P5DT16H" },

                { symbol: "etc#usd_1w", alias: "etc#usd_this-week", duration: "P5DT16H" },
                { symbol: "etc#usd_2w", alias: "etc#usd_next-week", duration: "P5DT16H" },
                { symbol: "etc#usd_1q", alias: "etc#usd_quarter", duration: "P5DT16H" },

                { symbol: "bch#usd_1w", alias: "bch#usd_this-week", duration: "P5DT16H" },
                { symbol: "bch#usd_2w", alias: "bch#usd_next-week", duration: "P5DT16H" },
                { symbol: "bch#usd_1q", alias: "bch#usd_quarter", duration: "P5DT16H" },
            
                "ace#btc,ace#eth,ace#usdt,act#bch,act#btc,bcd#usdt,bch#btc,bch#usdt,bcx#bch,bcx#btc,bnt#btc,bnt#eth,bnt#usdt,btc#usdt,btg#bch,btg#btc,btg#usdt,btm#btc,btm#eth,btm#usdt,bt2#btc,cmt#bch,cmt#btc,cmt#eth,cmt#usdt,ctr#btc,ctr#eth,ctr#usdt,cvc#btc,cvc#eth,cvc#usdt,dash#bch,dash#btc,dash#eth,dash#usdt,dat#btc,dat#eth,dat#usdt,dgb#btc,dgb#eth,dgb#usdt,dgd#bch,dgd#btc,dgd#eth,dgd#usdt,dnt#btc,dnt#eth,dnt#usdt,dpy#btc,dpy#eth,dpy#usdt,edo#bch,edo#btc,edo#eth,edo#usdt,elf#btc,elf#eth,elf#usdt,eng#btc,eng#eth,eng#usdt,eos#bch,eos#btc,eos#eth,eos#usdt,etc#bch,etc#btc,etc#eth,etc#usdt,eth#btc,eth#usdt,evx#btc,evx#eth,evx#usdt,fun#btc,fun#eth,fun#usdt,gas#btc,gas#eth,gas#usdt,gnt#btc,gnt#eth,gnt#usdt,gnx#btc,gnx#eth,gnx#usdt,hsr#btc,hsr#eth,hsr#usdt,icn#btc,icn#eth,icn#usdt,icx#btc,icx#eth,icx#usdt,iota#btc,iota#eth,iota#usdt,itc#btc,itc#eth,itc#usdt,kcash#btc,kcash#eth,kcash#usdt,knc#btc,knc#eth,knc#usdt,link#btc,link#eth,link#usdt,lrc#btc,lrc#eth,lrc#usdt,ltc#bch,ltc#btc,ltc#eth,ltc#usdt,mana#btc,mana#eth,mana#usdt,mco#btc,mco#eth,mco#usdt,mda#btc,mda#eth,mda#usdt,mdt#btc,mdt#eth,mdt#usdt,mth#btc,mth#eth,mth#usdt,mtl#btc,mtl#eth,mtl#usdt,nas#btc,nas#eth,nas#usdt,neo#btc,neo#eth,neo#usdt,nuls#btc,nuls#eth,nuls#usdt,oax#btc,oax#eth,oax#usdt,omg#btc,omg#eth,omg#usdt,pay#btc,pay#eth,pay#usdt,ppt#btc,ppt#eth,ppt#usdt,pro#btc,pro#eth,pro#usdt,qtum#btc,qtum#eth,qtum#usdt,qvt#btc,qvt#eth,qvt#usdt,rcn#btc,rcn#eth,rcn#usdt,rdn#btc,rdn#eth,rdn#usdt,read#btc,read#eth,read#usdt,req#btc,req#eth,req#usdt,rnt#btc,rnt#eth,rnt#usdt,salt#btc,salt#eth,salt#usdt,san#btc,san#eth,san#usdt,sbtc#bch,sbtc#btc,sngls#btc,sngls#eth,sngls#usdt,snm#btc,snm#eth,snm#usdt,snt#btc,snt#eth,snt#usdt,ssc#btc,ssc#eth,ssc#usdt,storj#btc,storj#eth,storj#usdt,sub#btc,sub#eth,sub#usdt,swftc#btc,swftc#eth,swftc#usdt,tnb#btc,tnb#eth,tnb#usdt,trx#btc,trx#eth,trx#usdt,ugc#btc,ugc#eth,ugc#usdt,ukg#btc,ukg#eth,ukg#usdt,vee#btc,vee#eth,vee#usdt,wrc#btc,wrc#eth,wrc#usdt,wtc#btc,wtc#eth,wtc#usdt,xem#btc,xem#eth,xem#usdt,xlm#btc,xlm#eth,xlm#usdt,xmr#btc,xmr#eth,xmr#usdt,xrp#btc,xrp#eth,xrp#usdt,xuc#btc,xuc#eth,xuc#usdt,yoyo#btc,yoyo#eth,yoyo#usdt,zec#btc,zec#eth,zec#usdt,zrx#btc,zrx#eth,zrx#usdt,1st#btc,1st#eth,1st#usdt"
                //"ace#btc,ace#eth,ace#usdt,act#bch,act#btc,act#eth,act#usdt,amm#btc,amm#eth,amm#usdt,ark#btc,ark#eth,ark#usdt,ast#btc,ast#eth,ast#usdt,avt#bch,avt#btc,avt#eth,avt#usdt,bcd#bch,bcd#btc,bcd#usdt,bch#btc,bch#usdt,bcx#bch,bcx#btc,bnt#btc,bnt#eth,bnt#usdt,btc#usdt,btg#bch,btg#btc,btg#usdt,btm#btc,btm#eth,btm#usdt,bt2#btc,cmt#bch,cmt#btc,cmt#eth,cmt#usdt,ctr#btc,ctr#eth,ctr#usdt,cvc#btc,cvc#eth,cvc#usdt,dash#bch,dash#btc,dash#eth,dash#usdt,dat#btc,dat#eth,dat#usdt,dgb#btc,dgb#eth,dgb#usdt,dgd#bch,dgd#btc,dgd#eth,dgd#usdt,dnt#btc,dnt#eth,dnt#usdt,dpy#btc,dpy#eth,dpy#usdt,edo#bch,edo#btc,edo#eth,edo#usdt,elf#btc,elf#eth,elf#usdt,eng#btc,eng#eth,eng#usdt,eos#bch,eos#btc,eos#eth,eos#usdt,etc#bch,etc#btc,etc#eth,etc#usdt,eth#btc,eth#usdt,evx#btc,evx#eth,evx#usdt,fun#btc,fun#eth,fun#usdt,gas#btc,gas#eth,gas#usdt,gnt#btc,gnt#eth,gnt#usdt,gnx#btc,gnx#eth,gnx#usdt,hsr#btc,hsr#eth,hsr#usdt,icn#btc,icn#eth,icn#usdt,icx#btc,icx#eth,icx#usdt,iota#btc,iota#eth,iota#usdt,itc#btc,itc#eth,itc#usdt,kcash#btc,kcash#eth,kcash#usdt,knc#btc,knc#eth,knc#usdt,link#btc,link#eth,link#usdt,lrc#btc,lrc#eth,lrc#usdt,ltc#bch,ltc#btc,ltc#eth,ltc#usdt,mana#btc,mana#eth,mana#usdt,mco#btc,mco#eth,mco#usdt,mda#btc,mda#eth,mda#usdt,mdt#btc,mdt#eth,mdt#usdt,mth#btc,mth#eth,mth#usdt,mtl#btc,mtl#eth,mtl#usdt,nas#btc,nas#eth,nas#usdt,neo#btc,neo#eth,neo#usdt,nuls#btc,nuls#eth,nuls#usdt,oax#btc,oax#eth,oax#usdt,omg#btc,omg#eth,omg#usdt,pay#btc,pay#eth,pay#usdt,ppt#btc,ppt#eth,ppt#usdt,pro#btc,pro#eth,pro#usdt,qtum#btc,qtum#eth,qtum#usdt,qvt#btc,qvt#eth,qvt#usdt,rcn#btc,rcn#eth,rcn#usdt,rdn#btc,rdn#eth,rdn#usdt,read#btc,read#eth,read#usdt,req#btc,req#eth,req#usdt,rnt#btc,rnt#eth,rnt#usdt,salt#btc,salt#eth,salt#usdt,san#btc,san#eth,san#usdt,sbtc#bch,sbtc#btc,sngls#btc,sngls#eth,sngls#usdt,snm#btc,snm#eth,snm#usdt,snt#btc,snt#eth,snt#usdt,ssc#btc,ssc#eth,ssc#usdt,storj#btc,storj#eth,storj#usdt,sub#btc,sub#eth,sub#usdt,swftc#btc,swftc#eth,swftc#usdt,tnb#btc,tnb#eth,tnb#usdt,trx#btc,trx#eth,trx#usdt,ugc#btc,ugc#eth,ugc#usdt,ukg#btc,ukg#eth,ukg#usdt,vee#btc,vee#eth,vee#usdt,wrc#btc,wrc#eth,wrc#usdt,wtc#btc,wtc#eth,wtc#usdt,xem#btc,xem#eth,xem#usdt,xlm#btc,xlm#eth,xlm#usdt,xmr#btc,xmr#eth,xmr#usdt,xrp#btc,xrp#eth,xrp#usdt,xuc#btc,xuc#eth,xuc#usdt,yoyo#btc,yoyo#eth,yoyo#usdt,zec#btc,zec#eth,zec#usdt,zrx#btc,zrx#eth,zrx#usdt,1st#btc,1st#eth,1st#usdt"

            ],
            wallets: ['margin','exchange'],//钱包有三种类型，exchange（现货交易钱包）, funding（借贷）, margin（保证金交易钱包）
            standardCoin: "usd",
            timeZone: "+08:00",
            isValid: true,
            clients: {
                api: { supported: false },
                client: { supported: true },
                futuresApi: { supported: true },
                futuresClient: { supported: true }
            }
        },
        {
            //bitmex  bitmex.com
            site: "bitmex",
            autoTransfer: false,
            coins: [{ coin: "btc", payFee: 0.0001, alias: "XBT"}],
            symbols: [
                { symbol: "btc#usd_1q", alias: "XBTM17" },
                { symbol: "btc#usd_ever", alias: "XBTUSD" },
                { symbol: "btc#cny_1q", alias: "XBCM17" },
                { symbol: "btc#jpy_1q", alias: "XBJM17" },
                { symbol: "zec#btc_1q", alias: "ZECM17" },

                { symbol: "eth#btc_j17", alias: "ETHJ17", duration: "P28DT12H" },
                { symbol: "xmr#btc_j17", alias: "XMRJ17", duration: "P28DT12H" },
                { symbol: "etc#btc_1w", alias: "ETC7D" },

                { symbol: "ltc#btc_1w", alias: "LTC7D" },
                { symbol: "fct#btc_1w", alias: "FCT7D" },
                { symbol: "dash_j17", alias: "DASHJ17", duration: "P28DT12H" }

            ],
            wallets: ['margin'],//钱包有三种类型，exchange（现货交易钱包）, funding（借贷）, margin（保证金交易钱包）
            defaultFee: { payFee: 0.0001, tradeFee: { maker: -0.0250, taker: 0.0750} },
            //"futures": [],
            socket: { trade: 1, market: 1, account: 1 },
            standardCoin: "btc",
            timeZone: 0,
            isValid: false,
            clients: {
                api: { supported: false },
                client: { supported: false },
                futuresApi: { supported: true },
                futuresClient: { supported: true }
            }
        },
        {
            //bitfinex  bitfinex.com //todo
            site: "bitfinex",
            autoTransfer: false,
            //BTCUSD,LTCUSD,LTCBTC,ETHUSD,ETHBTC,ETCUSD,ETCBTC,BFXUSD,BFXBTC,RRTUSD,RRTBTC,ZECUSD,ZECBTC,EOSBTC,EOSUSD,EOSETH
            symbols: ["btc#usd","ltc#usd","ltc#btc","eth#usd","eth#btc","etc#btc","etc#usd","bch#usd","bch#btc","bch#eth"],
            // symbols: ["btc#usd","ltc#usd","ltc#btc","eth#usd","eth#btc","etc#btc","etc#usd",
            //        "rrt#usd","rrt#btc","zec#usd","zec#btc","xmr#usd","xmr#btc","dash#usd","dash#btc",
            //        "btc#eur","xrp#usd","xrp#btc","iota#usd","iota#btc","iota#eth","eos#usd","eos#btc",
            //        "eos#eth","san#usd","san#btc","san#eth","omg#usd","omg#btc","omg#eth","bch#usd","bch#btc",
            //        "bch#eth","neo#usd","neo#btc","neo#eth","etp#usd","etp#btc","etp#eth","qtum#usd","qtum#btc",
            //        "qtum#eth","avt#usd","avt#btc","avt#eth","edo#usd","edo#btc","edo#eth","btg#usd","btg#btc",
            //        "dat#usd","dat#btc","dat#eth","qsh#usd","qsh#btc","qsh#eth","yyw#usd","yyw#btc","yyw#eth",
            //        "gnt#usd","gnt#btc","gnt#eth","snt#usd","snt#btc","snt#eth","iota#eur"],
            /*"socket": { trade: 1,market: 1,account: 1 },*/
            standardCoin: "usd",
            timeZone: 0,
            isValid: true,
            clients:{ 
                api: { supported: true },
                client: { supported: true },
                futuresApi: { supported: false }, 
                futuresClient: { supported: false }
            }
        }
    ]
    // sites: [
    //     'okex','bitfinex'
    // ]
}
module.exports = config;