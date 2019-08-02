const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const merge = require('webpack-merge');

const prodCommon = {
  mode: 'production',
  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },
};

const node = merge(common.node, prodCommon);
const web = merge(common.web, prodCommon);

module.exports = [node, web];
