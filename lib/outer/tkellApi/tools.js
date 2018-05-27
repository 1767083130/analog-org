'use strict';

/**
 * tkell的工具类
 */
let tools = new class {

    getServiceUrl(apiUrl) {
        return `${this.getMainDomain()}/DesktopModules/Services/Api${apiUrl}`;
    }

    getMainDomain() {
        var isTest = this.isTest();
        if (isTest) {
            return "http://localhost"; //TODO 这里测试先改为www.360yee.com
        }
        else
        {
            return "http://www.tkell.cn";
        }
    }
    

    isTest() {
        return false; 
    }

}();

module.exports = tools
