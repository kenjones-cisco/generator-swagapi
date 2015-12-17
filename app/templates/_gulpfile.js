'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var istanbul = require('gulp-istanbul');
var jasmine = require('gulp-jasmine');

var SOURCE_CODE = ['handlers/*.js', 'models/*.js', 'server.js'];
var TEST_CODE = ['tests/test*.js'];


gulp.task('lint', function () {
    return gulp.src(SOURCE_CODE)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('pre-test', function () {
    return gulp.src(SOURCE_CODE)
        // Covering files
        .pipe(istanbul())
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['lint', 'pre-test'], function () {
    return gulp.src(TEST_CODE)
        .pipe(jasmine())
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports())
        // required otherwise the process never actually exits
        .once('end', function () {
            process.kill(process.pid, 'SIGINT');
            setTimeout(function() {
                /* eslint-disable */
                process.exit(0);
                /* eslint-enable */
            }, 100);
        });
});

gulp.task('cover', ['lint', 'pre-test'], function () {
    return gulp.src(TEST_CODE)
        .pipe(jasmine())
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports({
            reporters: ['html']
        }))
        // required otherwise the process never actually exits
        .once('end', function () {
            process.kill(process.pid, 'SIGINT');
            setTimeout(function() {
                /* eslint-disable */
                process.exit(0);
                /* eslint-enable */
            }, 100);
        });
});
