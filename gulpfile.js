const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const replace = require('gulp-replace');
const babel = require('gulp-babel');
const browsersync = require('browser-sync').create();

const files = {
  scssPath: 'app/scss/**/*.scss',
  jsPath: 'app/js/**/*.js',
};

const scssTask = function () {
  return src(files.scssPath, { sourcemaps: true })
    .pipe(sass())
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(dest('dist', { sourcemaps: '.' }));
};

const jsTask = function () {
  return src([files.jsPath], { sourcemaps: true })
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(concat('all.js'))
    .pipe(terser())
    .pipe(dest('dist', { sourcemaps: '.' }));
};

const cacheBustTask = function () {
  var cbString = new Date().getTime();
  return src(['index.html'])
    .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
    .pipe(dest('.'));
};

const browserSyncServe = function (callBack) {
  browsersync.init({
    server: {
      baseDir: '.',
    },
    notify: {
      styles: {
        top: 'auto',
        bottom: '0',
      },
    },
  });
  callBack();
};

const browserSyncReload = function (callBack) {
  browsersync.reload();
  callBack();
};

function watchTask() {
  watch(
    [files.scssPath, files.jsPath],
    { interval: 1000, usePolling: true },
    series(parallel(scssTask, jsTask), cacheBustTask)
  );
}

function browserSyncWatchTask() {
  watch('index.html', browserSyncReload);
  watch(
    [files.scssPath, files.jsPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(sassTask, jsTask), cacheBustTask, browserSyncReload)
  );
}

exports.default = series(parallel(scssTask, jsTask), cacheBustTask, watchTask);

exports.browserSync = series(
  parallel(scssTask, jsTask),
  cacheBustTask,
  browserSyncServe,
  browserSyncWatchTask
);
