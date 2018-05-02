'use strict';
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
//const models = path.join(path.resolve(__dirname, '..'), 'models');

var db = function(){
    
    var initModels = function(dir){
        dir = dir || '';
        let models = path.join(path.resolve(__dirname, '..'),'models',dir);
        fs.readdirSync(models).forEach(function(item){
            let stat = fs.lstatSync(path.join(models,item));
            if(stat.isDirectory()){
                return initModels(item);
            }

            if(~item.search(/^[^\.].*\.js$/)){
                try{
                    require(`../models/${dir}/${item}`);
                } catch(e){
                    console.log(`注册model失败。路径为../models/${dir}/${item}`);
                    throw e;
                }
            }
        });
    };

    return {
        config: function(conf){
            // Bootstrap models
            initModels();

            //connect db
            mongoose.Promise = global.Promise;
            mongoose.connect('mongodb://' + conf.host + '/' + conf.database);
            var db = mongoose.connection;
            db.on('error',console.error.bind(console,'connection error:'));
            db.once('open',function callback(){
                console.log('db connection open');
            });
        }
    };

};

module.exports = db();


