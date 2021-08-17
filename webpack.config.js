const path = require('path');
const fs   = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    https: {
      key:  fs.readFileSync('../Certificates/macos/private.key'),
      cert: fs.readFileSync('../Certificates/macos/private.crt'),
    },
    host: '0.0.0.0',
    port: 8080,
    disableHostCheck: true,
  },
  plugins: [
    new FaviconsWebpackPlugin({
      logo: './src/assets/automaton.logo.org.png',
      cache: true,
    }),
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
        test: /\.(css)$/,
        use: ['style-loader','css-loader']
      },
      {
        test: /\.(s(a|c)ss)$/,
        use: ['style-loader','css-loader', 'sass-loader']
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: { loader: 'file-loader' },
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
