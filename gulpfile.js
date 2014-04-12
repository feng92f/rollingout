'use strict';

var gulp           = require('gulp');
var log            = require('gulp-util').log;
var livereload     = require('gulp-livereload');
var rjs            = require('gulp-rjs');
var watch          = require('gulp-watch');
var concat         = require('gulp-concat');
var htmlreplace    = require('gulp-html-replace');
var requirejs      = require('requirejs');
var shell          = require('shelljs');
var async          = require('async');
var fs             = require('fs');
var crypto         = require('crypto');
var moment         = require('moment');

var codeFiles = 'www/src/*/*';
var cssFiles = 'www/src/css/*';

gulp.task('watch', function() {
  return gulp.src(['www/src/js/*','www/src/css/*','www/src/*'])
  .pipe(watch())
  .pipe(livereload());
});

gulp.task('build:js',['build:drop'], function(done) {

  requirejs.optimize({
    name:'main',
    baseUrl:'www/src/js',
    include:'libs/require.js',
    mainConfigFile:'www/src/js/libs/require.config.js',
    out:'www/build/js/main.js'
  },function(){
      done();
  });

});

gulp.task('build:drop', function(done) {

  var files = ['www/build/css/*','www/build/img/*','www/build/js/*','www/build/assets','www/build/sounds','www/build/fonts'];

  var flows = files.map(function(file){

    return function(callback){

        shell.exec('rm -rf' + file, function(code, output) {
          callback(null, code);
        });
    }

  });


  async.parallel(flows, function(err, results){
    done();
  });


});


gulp.task('build:css',['build:drop'], function(done) {

  return gulp.src(cssFiles)
  .pipe(concat('style.css'))
  .pipe(gulp.dest('www/build/css'));

});

gulp.task('build:index',['build:drop','build:js','build:css'], function(done) {

  var js  = fs.readFileSync('www/build/js/main.js');
  var css = fs.readFileSync('www/build/css/style.css');

  var hash_js  = crypto.createHash('sha1');
  var hash_css = crypto.createHash('sha1');

  hash_js.update(js);
  hash_css.update(css);

  hash_js  = hash_js.digest('hex');
  hash_css = hash_css.digest('hex');

  return gulp.src('www/src/index.html')
  .pipe(htmlreplace({
    'css': 'build/css/style.css?sha1=' + hash_css,
    'js': 'build/js/main.js?sha1=' + hash_js,
    'build':{
      src: moment().format('YYYY-MM-DD HH:mm:ss'),
      tpl: '<meta name="build" content="%s">'
    }
  }))
  .pipe(gulp.dest('www/build/'));

});


gulp.task('build:drop', function(done) {

  var files = ['www/build/css/*','www/build/img/*','www/build/js/*', 'www/build/assets/*','www/build/sounds/*','www/build/fonts/*'];

  var flows = files.map(function(file){

    return function(callback){

        shell.exec('rm ' + file, function(code, output) {
          callback(null, code);
        });
    }

  });


  async.parallel(flows, function(err, results){
    done();
  });

});

gulp.task('build:assets',['build:drop'], function(done) {

  var files = ['www/src/assets','www/src/sounds','www/src/fonts'];

  var flows = files.map(function(file){

    return function(callback){

        shell.exec('cp -r ' + file + ' www/build/',function(code, output) {
          callback()
        });
    }

  });

  async.parallel(flows, function(err, results){
    done();
  });

});



gulp.task('copy:img', ['build:drop'], function(done) {

  var files = ['www/src/img/*'];
  return gulp.src(files)
  .pipe(gulp.dest('www/build/img'));

});

gulp.task('build', ['build:css','build:assets','copy:img','build:js','build:index']);

gulp.task('default', function(){
  console.log('No default task');
});
