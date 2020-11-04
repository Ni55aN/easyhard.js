const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin')

const examples = fs.readdirSync('./src/list').map(file => path.basename(file, '.ts'));
const mode = 'development';

module.exports = {
  entry: examples.reduce((entries, name) => 
    ({ ...entries, [name]: (`./src/list/${name}.ts`) }),
    {}
  ),
  mode,
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  },
  module: {
    rules: [
      // {
      //   enforce: 'pre',
      //   test: /\.(j|t)sx?$/,
      //   exclude: /node_modules/,
      //   loader: 'eslint-loader'
      // },
      {
        test: /\.tsx?$/,
        loader: 'easyhard-loader'
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options:{	
          transpileOnly: true	// prevent bug with HMR
        },
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
    symlinks: false
  },
  output: {
    filename: `[name]${mode === 'development'?'':'.[chunkhash]'}.js`,
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    ...examples.map(name => new HtmlWebpackPlugin({
      inject: true, filename: `${name}.html`, chunks: ['vendors', name]
    }))
  ]
};