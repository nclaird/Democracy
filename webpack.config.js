var
    webpack = require('webpack'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');





var config = {
    entry: './src/main.ts',
    output: {
        filename: './dist/bundle.js'
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['', '.ts', '.js']
    },
    module: {
        loaders: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {test: /\.ts$/, loader: 'awesome-typescript-loader'},
            {test:/\.(scss|css)$/, loader: ExtractTextPlugin.extract('style', 'css!sass')
},            { test: /\.json/, loader: 'file?name=[name].[ext]' },


            { test: /\.html/, loader: 'html?name=[name].[ext]' }

        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
        }),
         new ExtractTextPlugin("styles.css")
        
    ],
    
    devServer: {
        contentBase: 'src/',
        historyApiFallback: true,
        stats: 'minimal'
    },
    devtool: 'source-map'
};


module.exports = config;
