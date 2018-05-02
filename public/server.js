var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
    hot: true,
    publicPath: "http://localhost:8080/v3/checkout",
    //contentBase: "./v3/checkout",
    historyApiFallback: true,
    proxy: {
        "/api/*": {
            target: "http://localhost:5000",
            secure: false
        }
    }
        
}).listen(8080, 'localhost', function (err, result) {
    if (err) {
        console.log(err);
    }

    console.log('Listening at 127.0.0.1:8080');
});
