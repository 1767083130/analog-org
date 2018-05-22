'use strict';

module.exports = {
    databaseConfig: {
        host: "localhost",
        database: "Stock"
    },
    test: { //过期的配置项
        testApp: {
            appKey: "a",
            appSecret: "0123456789abcdef"
        }
    },
    serverUrl: "ws://119.28.204.125:8080/ws",  
    security: {
        secret: "abdssdhfhde23239jhgdffdhhfhdvvxcm.dfhdjh?fdfhjdfhjhbgb", //加密密码 
        tkellApp: {
            appKey: "a",
            appSecret: "0123456789abcdef",
            authServerUrl: "http://localhost:8001/DesktopModules/JwtAuth/API/Auth/TokenGet",
            serverUrl: "http://localhost:8001/DesktopModules/Services/API"
        }
    },
    platforms: [],
    bcrypt: {
        difficulty: 8
    },
    business: {
        natural: "cny",
        transfer: {
            minOrderWait: 50 * 60 * 1000, //50分钟
            maxOrderWait: 5 * 60 * 60 * 1000  //5个小时
        }
    }
}
