var path = require('path');
//var webpack = require('webpack');

//var ignoreFiles = new webpack.IgnorePlugin(/\.\/jquery-last.js$/);
// definePlugin 接收字符串插入到代码当中, 所以你需要的话可以写上 JS 的字符串
//var definePlugin = new webpack.DefinePlugin({
//    __DEV__: true,
//    __PRERELEASE__: false
//});

module.exports = {
    entry: "./src/jquery.pagination.js",
    output: {
        path: __dirname,
        filename: "./jquery.pagination.js"
    },
    module: {
    loaders: [
        //{ test: /\.css$/, loader: "style!css" },
        { test: /\.css$/, loader: 'style-loader!css-loader' },
        //{ test: /\.js$/, loader: 'jsx-loader?harmony' },
        { test: /\.scss$/, loader: 'style!css!sass?sourceMap'},
        { test: /\.(png|jpg|gif)$/, loader: 'url-loader?limit=8192'}

        //{
        //  test: /\.jsx$/,
        //  loader: 'jsx-loader?harmony'
        //}
    ]
    },
    //plugins: [ignoreFiles, definePlugin],
    externals: {
        "jquery":"jQuery"
    }
};