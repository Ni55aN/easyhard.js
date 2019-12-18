const path = require('path');

function multipleLibraryTargets(config) {
  const formats = ['var', 'commonjs2', 'amd', 'umd'];

  return formats.map(format => ({
    ...config,
    output: {
      ...config.output,
      filename: config.output.filename.replace('[target]', format),
      libraryTarget: format
    }
  }));
}

module.exports = multipleLibraryTargets({
  entry: './src/index.ts',
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: 'easyhard.[target].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'Easyhard'
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        loader: 'eslint-loader'
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: false
        }
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: ['rxjs', /^rxjs\/.+$/]
});