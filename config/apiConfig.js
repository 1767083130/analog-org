/**
* 配置说明： 
* 
* （1）关于期货的交割日配置
    交割日的计算方式：  当前周期的开端时间(第一天的0点) + duration

    a. timeZone: 使用的时区。默认为0时区。 8 表示东八区，比utc时间早8个小时
    b. duration
     #表示的两种方式
      （1）以"P"开头，表示以那个周期的起始点时间为基数。如"P3Y6M4DT12H30M5S"  参照ISO标准，https://en.wikipedia.org/wiki/ISO_8601#Durations
         当duration为空时，默认为当前周期最后一天的中午12点（以设置的时区计）
         注意当中的T，For example, "P3Y6M4DT12H30M5S" represents a duration of "three years, six months, four days, twelve hours, thirty minutes, and five seconds".
      （2）以“LP”开头，表示以当前时间所处周期段的最后1天时间的0点为基数。如"LPT16H",表示最后1天的下午4点
       
       特别的是，如果以"-"开头，表示倒推一段时间。
       如"-P2D",周期类型为“周”时，表示时间点所处的这个周期的开始时间点为基点，倒退2天，也就是上个星期五
       如"-LP2D",周期类型为“周”时，表示时间点所处的这个周期的结束时间点为基点，倒退2天
      
     #默认值
      如果在配置文件中不设置，系统会自动赋值为一个默认值
      (1)当周期为"d"时，为
      (2)当周期为"w"时，为
      (3)当周期为"d"时，为

    c.交割日有两种表现方式 
    （1）周期型。这种的结算周期都以数字开头，比如每隔一周结算一次  btc#cny_1w
    （2）一次型。以字母开头，比如在6.30日结算
    d. 关于alias需要注意的一点，如果别名存在"_"，使用"-"替换，避免与其他混淆 
*/

var config = {
    platforms: [
        {
            site: "okex",
            identifiers: [{ 
                appKey: "e684bfc7-185c-4c10-88ac-fccd5947633d",
                appSecret: "45B0A95951F620B442681FAECDF33CDE"
            }],
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
            restUrl: "https://www.okcoin.com/api/v1", //todo
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
            identifiers: [{
                appKey: "Agyo4pwZzZAVrDjHGpkLbDwz",
                appSecret: "Jpdy1F1kDnmKEjiJdhhT2p7bVQY9GBTM6YPWxElBbjWssln7"
            }],
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
            restUrl: "https://www.bitmex.com/api/v1/",
            futuresRestUrl: "https://www.bitmex.com/api/v1/",
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
            identifiers: [{
                appKey: "CLjlOwRbQndb2Fqdp6i7TgWGJc2nauq38HrRm18slip",
                appSecret: "x3DgAQ6dPzk4FdnHtVhQOevBzlXjZbEtKEcV7CTPhGA"
            }],
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
            restUrl: "https://www.bitmex.com/api/v1/",
            futuresRestUrl: "https://www.bitmex.com/api/v1/",
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
        },
        {
            site: "test_site", //用于测试的项
            identifiers: [{
                appKey: "64996",
                appSecret: "aJbHQUT8m50ggOOXruf4WVKt4j2lDuquyJzrDDygNJlC/Acy8qRby1TlDZYu/XhEEN7uw6Trr3RMC8MxVj4W2g=="
            }],
            autoTransfer: true,

            coins: [{ coin: "btc", payFee: 0.0001}],
            symbols: [{ symbol: "btc#cny", test: true, payFee: 0.0001 }, { symbol: "eth#cny", payFee: 0.01 }, //现货
                    {symbol: "btc#cny_1w", alias: "test_alias", test: true, payFee: 1, settlementFee: 1, tradeFee: { maker_buy: 1} }, //期货
                    {symbol: "eth#btc"},{symbol: "etc#btc"},
                    {symbol: ["btc#cny_2w", "btc_h1731", "btc_ever"], test: true, payFee: 1, settlementFee: 1, tradeFee: { maker_buy: 1}}], //期货
            restUrl: "https://api.bitvc.com/api/",
            futuresRestUrl: "https://api.bitvc.com/futures/",
            standardCoin: "cny",
            timeZone: "+08:00",
            isValid: false,            
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },

        {         
            site: "huobi",
            identifiers: [
                {
                    appKey: "ff01de28-2c1edde4-1d578373-f0373",
                    appSecret: "b7be20ee-75f30365-da5974f8-4f083"
                }
            ],
            autoTransfer: true, //是否支持自动转币
            symbols: [{ symbol: "btc#cny", tradeFee: ['0.2%', '0.2%'], fee: 0.0001, test: true }, { symbol: "ltc#cny", tradeFee: ['0.2%', '0.2%'], payFee: 0.001}], //支持的货币
            restUrl: "https://api.huobi.com/apiv3",
            standardCoin: "cny",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: true },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            },
            country: "cn"
        },
        {
            site: "okcoin",
            identifiers: [{
                appKey: "a",
                appSecret: "0123456789abcdef"
            }],
            autoTransfer: false,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "ltc#cny", payFee: 0.001}],
            restUrl: "https://www.okcoin.cn/api/v1",
            standardCoin: "cny",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },
        {
            site: "okcoin_com",
            identifiers: [{
                appKey: "a49cb4b1-f5bf-438b-9137-4ce1d4763edf",
                appSecret: "5CCA8A7A89B451A6235285723E5039D8"
            }],
            autoTransfer: false,
            symbols: [
                /* NOTICE：因为"_"是系统保留字符，字段alias的交割日期部分使用“-”代替了交易网站中的"_",如“this_week”被替换成了"this-week" */
                { symbol: "btc#usd" }, 
                { symbol: "ltc#usd" },
                { symbol: "eth#usd" }
            ],
            restUrl: "https://www.okcoin.com/api/v1",
            standardCoin: "usd",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },
        {
            //比特币交易网 btctrade.com
            site: "btctrade",
            identifiers: [
                {
                    appKey: "3frrr-rpuiq-pwtxa-uxdvc-ka4p1-768gg-uiwja",
                    appSecret: "Qq!D.-ScVC6-~n$vc-r!AAR-BQ,S9-nERf5-(/v^q"
                }
            ],
            autoTransfer: false,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "ltc#cny", payFee: 0.001 }, { symbol: "eth#cny", payFee: 0.01}],
            restUrl: "http://api.btctrade.com",
            standardCoin: "cny",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },
        {
            //中国比特币 chbtc.com
            site: "chbtc",
            identifiers: [
                {
                    appKey: "bda2fe0d-30f1-4e00-8d0c-bf721629b2a2",
                    appSecret: "c0175071-bd51-45ed-a6bd-915cf61ae8ad"
                }
            ],
            autoTransfer: true,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "ltc#cny", payFee: 0.001 }, { symbol: "eth#cny", payFee: 0.01}, { symbol: "etc#cny", payFee: 0.01}],
            restUrl: "https://trade.chbtc.com/api/",
            standardCoin: "cny",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },
        {
            //云币网 yunbi.com
            site: "yunbi",
            identifiers: [{
                appKey: "Ac1OtpQRDYEb0n6iCpDq2lAbgQvepxd030w3ZpN5",
                appSecret: "FOAaxLBuiW1icRGfzifBOOXE6Z7EFMqx6C8MCUgN"
            }],
            autoTransfer: true,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "eth#cny", payFee: 0.01}],
            restUrl: "https://yunbi.com/",
            standardCoin: "cny",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },
        {
            //poloniex网 poloniex.com
            site: "poloniex",
            identifiers: [{
                appKey: "K80HI3LP-DVJBC7HT-RPRMAOTB-J5OWKBTV",
                appSecret: "9630538c1693a989749a8cf672d49c7cd9cc639f62fb12d4c64beac62e738922f5facb1fcee5b2df5f8c0efa5e00a04bc973e5ba3841520b0536ab2ac17414df"
            }],
            autoTransfer: false,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "eth#cny", payFee: 0.01}],
            restUrl: "https://poloniex.com",
            standardCoin: "usd",
            timeZone: 0,
            isValid: false,
            clients:  {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },
        {
            //bitvc bitvc.com
            site: "bitvc",
            identifiers: [{
                appKey: "57069551-0185269d-3aa4dfa5-49c2a86a",
                appSecret: "b814f982-c16ce365-35aec429-69e50033"
            }],
            autoTransfer: false,
            coins: [{ coin: "btc", payFee: 0.0001}],
            symbols: [{symbol: "btc#cny_1w", test: true, payFee: 1, settlementFee: 1, tradeFee: { maker_buy: 1}}], //期货
            restUrl: "https://api.bitvc.com/api/",
            futuresRestUrl: "https://api.bitvc.com/futures/",
            standardCoin: "btc",
            timeZone: "+08:00",
            isValid: false,
            clients: {
                api: { supported: false },
                client: { supported: false },
                futuresApi: { supported: true },
                futuresClient: { supported: false }
            },
            futureIndexs: ['btc','ltc']
        },

        {
            //quoine
            site: "quoine",
            identifiers: [{
                appKey: "64996",
                appSecret: "aJbHQUT8m50ggOOXruf4WVKt4j2lDuquyJzrDDygNJlC/Acy8qRby1TlDZYu/XhEEN7uw6Trr3RMC8MxVj4W2g=="
            }],
            autoTransfer: false,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "eth#cny", payFee: 0.01 },
                        { symbol: "btc#cny_7d", tradeFee: { maker_buy: 0}}],
            restUrl: "https://www.bitmex.com/api/v1/",
            futuresRestUrl: "https://www.bitmex.com/api/v1/",
            standardCoin: "jpy",
            timeZone: 0,
            isValid: false,
            clients: {
                api: { supported: false },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        },

        {
            //bitflyer  bitflyer.com
            site: "bitflyer",
            identifiers: [{
                appKey: "64996",
                appSecret: "aJbHQUT8m50ggOOXruf4WVKt4j2lDuquyJzrDDygNJlC/Acy8qRby1TlDZYu/XhEEN7uw6Trr3RMC8MxVj4W2g=="
            }],
            autoTransfer: false,
            symbols: [{ symbol: "btc#cny", payFee: 0.0001 }, { symbol: "eth#cny", payFee: 0.01 }, //culture
                        {symbol: "btc#cny_7d", tradeFee: { maker_buy: 0}}], //futures
            restUrl: "https://www.bitmex.com/api/v1/",
            futuresRestUrl: "https://www.bitmex.com/api/v1/",
            standardCoin: "jpy",
            timeZone: 0,
            isValid: false,
            clients: {
                api: { supported: true },
                client: { supported: false },
                futuresApi: { supported: false },
                futuresClient: { supported: false }
            }
        }

    ]
}