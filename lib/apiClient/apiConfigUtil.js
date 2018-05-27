
'use strict';

const ConfigUtility = require('ws-client').ConfigUtility;
const apiConfig = require('../../config/apiConfig');

module.exports = new ConfigUtility(apiConfig);