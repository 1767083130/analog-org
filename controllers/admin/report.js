1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');
const Strategy = mongoose.model('Strategy');
const Order = mongoose.model('Order');

const co = require('co');
const async = require('co').wrap;
const only = require('only');
const accountLib = require('../../lib/account');
const transfer = require('../../lib/transfer');
const order = require('../../lib/order');
const configUtil = require('../../lib/utils/configUtil');
const apiConfigUtil = require('../../lib/apiClient/apiConfigUtil');
const transferController = require('../../lib/transferStrategys/transferController');

module.exports = function (router) {
    router.get('/', async(function* (req, res) {
        try{
            list(req,res,function(result){
                res.render('admin/report',result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    }));
 
    router.get('/list', async(function* (req,res){
        try{
            list(req,res,function(result){
                res.json(result);
            });
            
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        } 
    }));

    router.post('/syncRecentOrders', async function(req, res) {
        try{
            let userName = req.user.userName;
            let site = req.body.site;

            let sites = [];
            if(site == -1){
                sites = apiConfigUtil.getSites();
            } else {
                sites.push(site);
            }

            let onChanged = async function(e){
                await transferController.onOrderStatusChanged(e);
            };
            let onDelayed = async function(e){
                await transferController.onOrderDelayed(e);
            }

            order.on('change',onChanged);
            order.on('delayed',onDelayed);

            let stepCallBack;
            await order.syncUserRecentOrders(userName,sites,stepCallBack);

            order.off('change',onChanged);
            order.off('delayed',onDelayed);

            res.json({ isSuccess: true });
        } catch(err){
            console.error(err);
            res.json({ isSuccess: false, code: 500, message: "500:服务器端发生错误"});
        }
    });
}

async function list(req,res,callback){
    let pageNumber = Number(req.body.page || '1') || 1;
    let pageSize = Number(req.body.rp || '10') || 10;

    let userName = req.user.userName;
    
    //设置查询条件变量
    let params = { } ;
    let showType = req.query.type || req.body.type;
    if( showType == 1 ){  //显示策略计划没用完成的委托
        let modifiedStart = new Date(+new Date() - 30 * 60 * 1000); //30 minutes 之前的数据
        let planLogId = req.query.planLogId;
        params = {
            userName: userName,
            isSysAuto: true,
            strategyPlanLogId: mongoose.Types.ObjectId(planLogId), //策略计划id
            modified: { $gt: modifiedStart},    //大于半小时之后
            status: { $in: ['wait','consign','part_success','will_cancel','wait_retry'] }  //,'auto_retry'
        };
    }else if( showType == 2 ){
        let planLogId = req.query.planLogId || req.body.planLogId;
        params = {
            strategyPlanLogId:mongoose.Types.ObjectId(planLogId)    //策略计划id
        };
    }

    //通过页面刷新fexligrid插件,setNewExtParam获取来的值

    let site = req.query.site || req.body.site;
    site && (params.site = site);

    let symbol = req.query.symbol || req.body.symbol;
    symbol && (params.symbol = symbol);

    let status = req.query.status || req.body.status;
    status && (params.status = status);

    let createdStart = req.query.createdStart || req.body.createdStart;
    let createdEnd = req.query.createdEnd || req.body.createdEnd;
    if(createdStart && createdEnd){
        params.created = {"$gte" : createdStart, "$lt" : createdEnd};  //ISODate
    } else if(createdStart){
        params.created = {"$gte" : createdStart };
    } else if(createdEnd){
        params.created = {"$lt" : createdEnd };
    }

    //获取成交总量\平均价
    let bargainAmountSum = await Order.aggregate([
        {
            $match: params 
        },
        { 
            $group: { 
                _id: { site:"$site",side:"$side",symbol:"$symbol" }, 
                bargainAmount: { $sum: "$bargainAmount" },
                total: { $sum:{ $multiply:["$bargainAmount","$avgPrice"] }},    //total总价
                sum: { $sum: "$bargainAmount" }     //sum总量
            }
        }
    ]);

    params.userName = userName;
    var options = {
        //select:   'title date author',
        sort: { created : -1 },
        //populate: 'strategyId',
        lean: true,
        page: pageNumber, 
        limit: pageSize
    };

    let business = configUtil.getBusiness();
    business.sites = apiConfigUtil.getSites();
    business.symbols = apiConfigUtil.getSiteSymbols();

    Order.paginate(params, options).then(async function(getRes) {
        let orders = getRes.docs || [];
        let t = {
            pageSize: getRes.limit,
            total: getRes.total,
            //orders: JSON.stringify(orders || []),
            business:JSON.stringify(business || []),
            bargainAmountSum:JSON.stringify(bargainAmountSum || []),
            isSuccess: true
        };  

        callback(t);
    });
}

