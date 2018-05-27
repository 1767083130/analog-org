
'use strict';

const ConfigUtility = require('ws-server').ConfigUtility;
const apiConfig = require('../../config/apiConfig');

module.exports = new ConfigUtility(apiConfig);