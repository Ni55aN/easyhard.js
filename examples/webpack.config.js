const { basename, join, resolve } = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = 'development';
const LIST_PATH = resolve(__dirname, 'client', 'list')
const examples = fs.readdirSync(LIST_PATH).map(item => {
  const itemPath = join(LIST_PATH, item)
  const stat = fs.statSync(itemPath)

  return {
    name: basename(item, '.ts'),
    path: stat.isDirectory() ? join(itemPath, 'index.ts') : itemPath
  }
})

module.exports = {
  entry: examples.reduce((entries, { name, path }) =>
    ({ ...entries, [name]: path }),
    {}
  ),
  mode,
  devtool: 'source-map',
  devServer: {
    contentBase: './dist/client',
    hot: true,
    proxy: {
      '/api': {
         target: 'ws://localhost:3000',
         ws: true
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        enforce: 'pre',
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        loader: 'eslint-loader'
      },
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
    path: resolve(__dirname, 'dist', 'client'),
  },
  plugins: [
    ...examples.map(({ name }) => new HtmlWebpackPlugin({
      inject: true, filename: `${name}.html`, chunks: ['vendors', name]
    }))
  ]
};
