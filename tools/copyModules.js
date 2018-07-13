'use strict';
var fs = require( 'fs' ),
    stat = fs.stat;
var path = require('path');

var rootPath = path.resolve(process.cwd(), '..');  
var ignoreFolders = ['node_modules'];

// 复制目录
exists(rootPath + '/server/ws-client', rootPath + '/analog-org/node_modules/ws-client',ignoreFolders, copy);
exists(rootPath + '/server/ws-server', rootPath + '/analog-org/node_modules/ws-server',ignoreFolders, copy);
//exists(rootPath + '/server/bitcoin-clients', rootPath + '/server/ws-server/node_modules/bitcoin-clients',ignoreFolders, copy);
exists(rootPath + '/server/bitcoin-clients', rootPath + '/analog-org/node_modules/ws-server/node_modules/bitcoin-clients',ignoreFolders, copy);

process.on('uncaughtException', function(e) {
    console.error(e);
});

/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
function copy( src, dst,ignoreFolders){
    // 读取目录中的所有文件/目录
    fs.readdir(src,function( err, paths){
        if( err ){
            throw err;
        }

        paths.forEach(function(path){
            var _src = src + '/' + path,
                _dst = dst + '/' + path,
                readable, writable;      
  
            stat(_src, function(err, st){
                if(err){
                    throw err;
                }
  
                // 判断是否为文件
                if(st.isFile()){
                    // 创建读取流
                    readable = fs.createReadStream( _src );
                    // 创建写入流
                    writable = fs.createWriteStream( _dst ); 
                    // 通过管道来传输流
                    readable.pipe( writable );
                }
                // 如果是目录则递归调用自身
                else if(st.isDirectory()){
                    var ignore = false;
                    for(var i = 0; i < ignoreFolders.length; i++){
                        let ignoreFolder = ignoreFolders[i];
                        if(_src.indexOf(ignoreFolder) != -1){
                            ignore = true;
                        }
                    }

                    if(!ignore){
                        exists(_src, _dst, ignoreFolders,copy);
                    }
                }
            });
        });
    });
};

// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
function exists(src, dst,ignoreFolders, callback ){
    fs.exists( dst, function(exists){
        // 已存在
        if( exists ){
            callback(src, dst,ignoreFolders);
        }
        // 不存在
        else{
            fs.mkdir( dst, function(){
                callback(src, dst,ignoreFolders);
            });
        }
    });
};


