const merge = require('webpack-merge');
const path = require('path');

const common = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'regiusmark',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
};

const node = merge(common, {
  target: 'node',
  output: {
    filename: 'index.js',
  },
  externals: {
    'big.js': 'big.js',
    'bs58': 'bs58',
    'bytebuffer': 'bytebuffer',
    'long': 'long',
    'sha.js': 'sha.js',
    'tweetnacl': 'tweetnacl'
  },
});

const web = merge(common, {
  target: 'web',
  output: {
    filename: 'index.browser.js',
  },
});

module.exports = { node, web };
