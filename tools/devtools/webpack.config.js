const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const PRODUCTION = process.env.PRODUCTION

module.exports = {
  mode: PRODUCTION ? 'production' : 'development',
  devtool: 'source-map',
  entry: {
    index: path.resolve(__dirname, 'src', 'index.ts'),
    panel: path.resolve(__dirname, 'src', 'panel/index.ts'),
    popup: path.resolve(__dirname, 'src', 'popup.ts'),
    content: path.resolve(__dirname, 'src', 'content.ts'),
    background: path.resolve(__dirname, 'src', 'background.ts'),
    inject: path.resolve(__dirname, 'src', 'inject/index.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new HtmlWebpackPlugin({
      inject: true, filename: `index.html`, chunks: ['vendors', 'index']
    }),
    new HtmlWebpackPlugin({
      inject: true, filename: `panel.html`, chunks: ['vendors', 'panel']
    }),
    new HtmlWebpackPlugin({
      inject: true, filename: `popup.html`, chunks: ['vendors', 'popup']
    }),
    new ESLintPlugin({
      extensions: ['ts'],
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' }
      ]
    }),
    new webpack.EnvironmentPlugin(['DEBUG'])
  ]
}
