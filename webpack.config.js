const path = require('path');
const fs   = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    https: {
      key:  fs.readFileSync('../Certificates/localhost.mac.key.pem'),
      cert: fs.readFileSync('../Certificates/localhost.mac.cert.pem'),
      ca:   fs.readFileSync('../Certificates/localhost.mac.cert.p12')
  }
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Bolt-Browser',
    }),
    new webpack.ProvidePlugin({
      m: 'mithril', //Global access
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
