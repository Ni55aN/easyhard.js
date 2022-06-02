const { basename, join, resolve } = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


const mode = process.env.PRODUCTION ? 'production' : 'development';
const SERVE = process.env.WEBPACK_SERVE
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
  snapshot: {
    managedPaths: [new RegExp(/^(.+?[\\/]node_modules)[\\/]((?!easyhard)).*[\\/]*/)]
  },
  devServer: {
    static: './dist/client',
    hot: true,
    allowedHosts: "all",
    proxy: {
      '/api': {
         target: 'ws://localhost:3000',
         ws: true
      },
      '/uws': {
         target: 'ws://localhost:9001',
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
    symlinks: false,
    alias: {
      'rxjs-alias': resolve(__dirname, 'node_modules/rxjs'),
      'easyhard-common-alias': resolve(__dirname, 'node_modules/easyhard-common'),
      'easyhard-alias': resolve(__dirname, 'node_modules/easyhard'),

      'rxjs/operators': resolve(__dirname, 'node_modules/easyhard-debug/rx.esm'),
      'rxjs': resolve(__dirname, 'node_modules/easyhard-debug/rx.esm'),
      'easyhard': resolve(__dirname, 'node_modules/easyhard-debug/core.esm'),
      'easyhard-common': resolve(__dirname, 'node_modules/easyhard-debug/common.esm')
    },
  },
  output: {
    filename: `[name]${mode === 'development'?'':'.[chunkhash]'}.js`,
    path: resolve(__dirname, 'dist', 'client'),
  },
  plugins: [
    ...examples.map(({ name }) => new HtmlWebpackPlugin({
      inject: true, filename: `${name}.html`, chunks: ['vendors', name]
    })),
    ...(!SERVE ? [new BundleAnalyzerPlugin({
      analyzerMode: 'static'
    })] : [])
  ]
};
