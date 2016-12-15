'use strict';

const path 			= require('path');

const gulp 			= require('gulp');
const sourcemaps 	= require('gulp-sourcemaps');
const gutil 		= require('gulp-util');
const gdata 		= require('gulp-data');
const del 			= require('del');
const gulpif 		= require('gulp-if');
const plumber 		= require('gulp-plumber');
const mergeStream 	= require('merge-stream');
const lodash 		= require('lodash');
const Sequence 		= require('run-sequence');
const watch 		= require('gulp-watch');
const realFavicon 	= require('gulp-real-favicon');
const debug 		= require('gulp-debug');
const filter 		= require('gulp-filter');
const fs 			= require('fs');

const eslint 		= require('gulp-eslint');
const webpack 		= require('webpack');
const webpackConfig = require(path.join(__dirname, '/webpack.config'));

const stylus 		= require('gulp-stylus');
const nib 			= require('nib');
const csso 			= require('gulp-csso');

const htmlmin 		= require('gulp-htmlmin');

const sequence 		= Sequence.use(gulp);

let sources = {
	// script: ['main.js', 'admin.coffee', 'popout.js', 'livestream.js'],
	style: ['layout.styl', 'theme_default.styl', 'theme_night.styl'],
	document: ['index.html']
};
let lintES = ['src/script/**/*.js', 'server/**/*.js', 'gulpfile.js', 'teemant.js', 'webpack.config.js'];

let inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1;

let eslintOpts = {
	rules: {
        quotes: [1, 'single'],
        semi: [1, 'always']
    },
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {
            impliedStrict: true,
            globalReturn: true
        }
    }
};

let stylusOpts = {
	use: nib(),
	compress: false
};

let cssoOpts = {
	restructure: true
};

let htmlminOpts = {
	collapseWhitespace: true,
	removeComments: true,
	removeAttributeQuotes: true,
	collapseBooleanAttributes: true,
	removeRedundantAttributes: true,
	removeEmptyAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true
};

let watchOpts = {
	readDelay: 500,
	verbose: true
};

// File where the favicon markups are stored
let faviconDataFile = 'build/icons/favicon-data.json';

if (inProduction) {
	webpackConfig.plugins.push(new webpack.optimize.DedupePlugin());
	webpackConfig.plugins.push(new webpack.optimize.OccurenceOrderPlugin(false));
	webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false,
			screw_ie8: true
		},
		comments: false,
		mangle: {
			screw_ie8: true
		},
		screw_ie8: true,
		sourceMap: false
	}));
}

let wpCompiler = webpack(lodash.assign({}, webpackConfig, {
	cache: {},
	devtool: inProduction ? null : 'inline-source-map',
	debug: !inProduction
}));

function webpackTask (callback) {
	// run webpack
	wpCompiler.run(function (err, stats) {
		if (err) throw new gutil.PluginError('webpack', err);
		gutil.log('[script]', stats.toString({
			colors: true,
			hash: false,
			version: false,
			chunks: false,
			chunkModules: false
		}));
		if (typeof callback === 'function') callback();
	});
}

function styleTask () {
	return gulp.src(sources.style.map(function (f) { return 'src/style/' + f; }))
		.pipe(plumber())
		.pipe(gulpif(!inProduction, sourcemaps.init()))
			.pipe(stylus(stylusOpts))
			.pipe(gulpif(inProduction, csso(cssoOpts)))
		.pipe(gulpif(!inProduction, sourcemaps.write()))
		.pipe(debug({title: '[style]'}))
		.pipe(gulp.dest('build/style/'));
}

function documentTask (p) {
	let data = {
		config: require('./server/config'),
		env: process.env.NODE_ENV || 'development',
	};
	return p
		.pipe(plumber())
		.pipe(gdata(function () { return data; }))
		.pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(faviconDataFile)).favicon.html_code))
		.pipe(gulpif(inProduction, htmlmin(htmlminOpts)))
		.pipe(gulp.dest('build/document/'))
		.pipe(debug({title: '[document]'}));
}

// Cleanup tasks
gulp.task('clean', () => del('build'));
gulp.task('clean:quick', ['clean:script', 'clean:style'], (done) => {
	done();
});
gulp.task('clean:script', () => {
	return del('build/script');
});
gulp.task('clean:style', () => {
	return del('build/style');
});
gulp.task('clean:icons', () => {
	return del('build/icons');
});
gulp.task('clean:document', () => {
  return del('build/document');
});

// Main tasks
gulp.task('script', ['clean:script'], webpackTask);
gulp.task('watch:script', () => {
	return watch(['src/script/**/*.js'], watchOpts, webpackTask);
});

gulp.task('style', ['clean:style'], styleTask);
gulp.task('watch:style', () => {
	return watch('src/style/**/*.styl', watchOpts, styleTask);
});

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the update-favicon task below).
gulp.task('generate-favicon', ['clean:icons'], (done) => {
	realFavicon.generateFavicon({
		masterPicture: 'static/image/diamond.svg',
		dest: 'build/icons/',
		iconsPath: '/',
		design: {
			ios: {
				masterPicture: 'static/image/diamond.svg',
				pictureAspect: 'backgroundAndMargin',
				backgroundColor: '#00c7e0',
				margin: '0%',
				appName: 'Teemant'
			},
			desktopBrowser: {},
			windows: {
				pictureAspect: 'noChange',
				backgroundColor: '#00c7e0',
				onConflict: 'override',
				appName: 'Teemant'
			},
			androidChrome: {
				masterPicture: 'static/image/diamond.svg',
				pictureAspect: 'noChange',
				themeColor: '#00c7e0',
				manifest: {
					name: 'Teemant',
					display: 'standalone',
					orientation: 'notSet',
					onConflict: 'override',
					declared: true
				}
			},
			safariPinnedTab: {
				pictureAspect: 'silhouette',
				themeColor: '#00c7e0'
			}
		},
		settings: {
			scalingAlgorithm: 'Lanczos',
			errorOnImageTooSmall: false
		},
		versioning: true,
		markupFile: faviconDataFile
	}, done);
});

gulp.task('update-favicon', (done) => {
	let currentVersion;
	try {
		currentVersion = JSON.parse(fs.readFileSync(faviconDataFile)).version;
	} catch (e) {}

	if (currentVersion) {
		realFavicon.checkForUpdates(currentVersion, function (err) {
			if (err) {
				throw err;
			}
			done();
		});
	} else {
		sequence('generate-favicon', done);
	}
});

gulp.task('document', ['clean:document', 'update-favicon'], () => {
  return documentTask(gulp.src(sources.document.map(function (f) { return 'src/document/' + f; })));
});

gulp.task('watch:document', () => {
  return documentTask(
    watch(['src/document/**/*.html'], watchOpts)
    .pipe(filter(sources.document.map(function (f) { return 'src/document/' + f; })))
  );
});

gulp.task('lint', () => {
	return mergeStream(
		gulp.src(lintES).pipe(eslint(eslintOpts))
						.pipe(eslint.format())
	);
});
gulp.task('watch:lint', () => {
	return mergeStream(
		watch(lintES, watchOpts, function (file) {
			gulp.src(file.path).pipe(eslint(eslintOpts))
							   .pipe(eslint.format());
		})
	);
});

// Default task
gulp.task('default', (done) => {
	sequence('script', 'style', 'lint', 'document', done);
});

// Watch task
gulp.task('watch', (done) => {
	sequence('default', ['watch:lint', 'watch:script', 'watch:style', 'watch:document'], done);
});
