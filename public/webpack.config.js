var path = require('path');
var webpack = require('webpack');

var dev = false;
//var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var ignoreFiles = new webpack.IgnorePlugin(/\.\/jquery-last.js$/);
//definePlugin 接收字符串插入到代码当中, 所以你需要的话可以写上 JS 的字符串
var definePlugin = new webpack.DefinePlugin({
    __DEV__: dev,
    __PRERELEASE__: !dev
});


module.exports = getExports([
    {
        entry: [
            './main.js',
        ],
        output: {
            path: __dirname + '/v3/checkout', //__dirname
            filename: "main.bundle.js"
        }
    },
    {
        entry: [
            './outer/checkout.js',
        ],
        output: {
            path: __dirname + '/v3/checkout/' , //__dirname
            filename: "checkout.js"
        }
    },
    {
        entry: [
            './loader/error.js',
        ],
        output: {
            path: __dirname + '/v3/checkout/' , //__dirname
            filename: "loadererror.js"
        }
    },
    {
        entry: [
            './loader/web.js',
        ],
        output: {
            path: __dirname + '/v3/checkout/' , //__dirname
            filename: "loaderweb.js"
        }
    }
]);   

function getExports(items) { 
    var exports = [];
    for(var i = 0; i < items.length;i++){
        var item = items[i];
        var pack = {
            devtool: dev ?  'eval-source-map' : 'eval', 
            entry: item.entry,
            output: item.output,
            plugins: [
                new webpack.HotModuleReplacementPlugin(),
                ignoreFiles,
                definePlugin,
                //uglifyJsPlugin,

            ],
            module: {
                loaders: getLoaders()
            },
            externals: {
                //"jquery": "jQuery",
                //"react": "window.React"
            },
            resolve: {
                alias : {
                },
                root: [ 
                    path.join(__dirname, "js/lib")
                ]
            }
        };
        
        //pack.output.publicPath = "http://localhost:8080/assets/";
        pack.entry.push('webpack-dev-server/client?http://localhost:8080');
        pack.entry.push('webpack/hot/dev-server');
        //pack.resolve = item.resolve;
        
        var plugins = item.plugins || [];
        for (var j=0; j < plugins.length; j++) {
            pack.plugins.push(plugins[j]);
        }
        
        exports.push(pack);
    }
    
    return exports;
}

function getLoaders() { 
    return [
        //{ test: /\.css$/, loader: "style!css" },
        {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        },
        // {
        //     test: /\.js$/,
        //     exclude: /node_modules/,
        //     loader: 'react-hot!jsx-loader'
        // },
        {
            test: /\.scss$/,
            loader: 'style!css!sass?sourceMap'
        },
        {
            test: /\.(png|jpg|gif)$/,
            loader: 'url-loader?limit=8192'
        },
        {
            test: /\.jsx$/,
            exclude: /node_modules/,
            loader: 'react-hot!jsx-loader?harmony' //react-hot!
        }
    ];
}