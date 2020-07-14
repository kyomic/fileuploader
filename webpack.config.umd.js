const polyfill = []
const os = require('os');
const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin'); 
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const resolve = dir => path.resolve(__dirname, dir);
const webpack = require('webpack')

const isDev = process.env.NODE_ENV == 'development'
const WEB_ENV = process.env.WEB_ENV;
let config = {
  entry:'./index.js',
  output:{
    path:`${__dirname}/lib`,
    filename:"index.js",
    library: 'fileuploader',
    libraryTarget: 'umd'
  },
  resolve:{
    // 设置别名
    extensions: ['.js', '.jsx'],
    alias: {
      '@': resolve('src')// 这样配置后 @ 可以指向 src 目录
    }
  },
  module:{
    rules: [
      { 
        test:/\.styl(us)?$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
            //选项的作用使用来提高效率的。
          },
          'stylus-loader'
        ]
      },
      { 
        test:/\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
            //选项的作用使用来提高效率的。
          },
          'stylus-loader'
        ]
      },
      {
        test: /\.(jsx)$/, exclude: /node_modules/, loader: 'babel-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader'
      }, 
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              minimize: false
            }
          },
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test:/\.less$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader']
      },
      {
        test: /\.(png|jpe?g|gif|psd|svg|icon)$/,
  　　　　loader: 'url-loader?limit=8192&name=images/[hash:8].[name].[ext]'
      }
    ]
  },
  mode:"production",
  plugins:[    
    new webpack.DefinePlugin({
      'dev':JSON.stringify(process.env.NODE_ENV)
    }),
    new HtmlWebpackPlugin( { filename: "index.html", template: path.join(__dirname, "./index.html") } ),
    
  ],
  optimization:{
    minimize:true
  }
}
module.exports = config;
