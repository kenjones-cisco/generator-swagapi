'use strict';

var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jasmine = require('gulp-jasmine');
var eslint = require('gulp-eslint');
var coveralls = require('gulp-coveralls');

var SOURCE_CODE = ['app/*.js', 'spec/*.js', 'models/*.js', 'handlers/*.js'];
var TEST_CODE = ['test/*.js'];

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
        .pipe(istanbul.writeReports());
});

gulp.task('cover', ['lint', 'pre-test'], function () {
    return gulp.src(TEST_CODE)
        .pipe(jasmine())
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports({
            reporters: ['html', 'lcov']
        }));
});

gulp.task('lint', function () {
    return gulp.src(SOURCE_CODE)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('coveralls', function () {
    return gulp.src('coverage/lcov.info')
        .pipe(coveralls());
});
