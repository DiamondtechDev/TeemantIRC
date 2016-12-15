'use strict';

const webpack = require('webpack');
const path = require('path');

let inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1;

module.exports = {
	entry: {
		main: ['./src/script/main']
	},
	output: {
		path: __dirname,
		filename: './build/script/[name].js',
		chunkFilename: './build/script/[id].js'
	},
	module: {
		preLoaders: [
			// { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ },
			// { test: /\.coffee$/, loader: 'coffeelint-loader', exclude: /node_modules/ },
		],
		loaders: [
			// { test: /\.mustache$/, loader: 'mustache', exclude: /node_modules/ }
		],
		noParse: [
			/node_modules/
		]
	},

	resolve: {
		extensions: ['', '.js', '.json'],
		root: [path.join(__dirname, '/src/script')],

		alias: {
			'underscore': 'lodash'
		}
	},

	plugins: [

		new webpack.ProvidePlugin({
			// Detect and inject
			_: 'underscore',
		})
	],

	devtool: 'inline-source-map',
	debug: true
};
