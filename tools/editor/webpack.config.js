const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules|assets/,
      },
      {
        resourceQuery: /raw/,
        type: 'asset/source'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      assert: false,
      os: require.resolve("os-browserify/browser")
    }
  },
  plugins: [
    new HtmlWebpackPlugin(),
    // new ESLintPlugin({
    //   extensions: ['ts'],
    // })
  ]
}
