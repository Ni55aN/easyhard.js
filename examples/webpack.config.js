const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin')

const examples = fs.readdirSync('./src/list').map(file => path.basename(file, '.ts'));

module.exports = {
  entry: examples.reduce((entries, name) => 
    ({ ...entries, [name]: (`./src/list/${name}.ts`) }),
    {}
  ),
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: "initial",
          name: "vendors",
          enforce: true
        }
      }
    }
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    ...examples.map(name => new HtmlWebpackPlugin({
      inject: true, filename: `${name}.html`, chunks: ['vendors', name]
    }))
  ]
};