"use strict"
const webpack = require("webpack")
const path=require('path')

module.exports = {
    entry: "./src/index-client.js",
    output: {
        path: path.resolve(__dirname,'public','js'),
        filename: "bundle.js"
    },
    watch: true,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['env', 'stage-1', 'react']
                }
            }
        ]
    }
}
