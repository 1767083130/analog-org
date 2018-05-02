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
    security: {
        secret: "abdssdhfhde23239jhgdffdhhfhdvvxcm.dfhdjh?fdfhjdfhjhbgb", //加密密码 
        tkellApp: {
            appKey: "a",
            appSecret: "0123456789abcdef",
            authServerUrl: "http://localhost:8001/DesktopModules/JwtAuth/API/Auth/TokenGet",
            serverUrl: "http://localhost:8001/DesktopModules/Services/API"
        }
    },
    platforms: []
}
