'use strict';

const mongoose = require('mongoose');
const Account  = mongoose.model('Account');
const ClientIdentifier  = mongoose.model('ClientIdentifier');

let clientIdentifier = new class{
    
    getUserClients(userName){
        return ClientIdentifier.getUserClients(userName);
    }

    getUserClient(userName,site){
        return ClientIdentifier.getUserClient(userName,site);
    }

    /**
     * 获取提币地址
     */
    getWithdrawAddress(client,coin){
        return ClientIdentifier.getWithdrawAddress(userName,site);
    }

}();

module.exports = clientIdentifier;