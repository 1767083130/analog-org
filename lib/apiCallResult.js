'use strict';

class ApiCallResult{
    constructor(){
        this.isSuccess = false;
        this.message = "";
        this.errorCode = "";
        this.result = null;
    }
}

module.exports = ApiCallResult;