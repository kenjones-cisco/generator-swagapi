'use strict';

var fs = require('fs');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jasmine = require('gulp-jasmine');
var eslint = require('gulp-eslint');
var coveralls = require('gulp-coveralls');
var publish = require('publish-please');
var conventionalChangelog = require('gulp-conventional-changelog');
var git = require('gulp-git');
var bump = require('gulp-bump');

var SOURCE_CODE = ['app/*.js', 'spec/*.js', 'models/*.js', 'handlers/*.js', 'lib/*.js'];
var TEST_CODE = ['test/*.js'];

var version = 'v' + JSON.parse(fs.readFileSync('./package.json')).version;


gulp.task('pre-test', function () {
    return gulp.src(SOURCE_CODE)
        // Covering files
        .pipe(istanbul())
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['lint'], function () {
    return gulp.src(TEST_CODE)
        .pipe(jasmine());
});

gulp.task('cover', ['lint', 'pre-test'], function () {
    return gulp.src(TEST_CODE)
        .pipe(jasmine())
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports());
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

gulp.task('changelog', function () {
    return gulp.src('CHANGELOG.md', {
        buffer: false
    })
    .pipe(conventionalChangelog({
        preset: 'angular',
        releaseCount: 0
    }))
    .pipe(gulp.dest('./'));
});

function inc(importance) {
    // get all the files to bump version in
    return gulp.src(['./package.json'])
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'));
}

gulp.task('bump-patch', function() {
    return inc('patch');
});

gulp.task('bump-feature', function() {
    return inc('minor');
});

gulp.task('bump-release', function() {
    return inc('major');
});

gulp.task('commit-release', ['changelog'], function () {
    return gulp.src(['./package.json', './CHANGELOG.md'])
        .pipe(git.commit('chore(release): Release ' + version));
});

gulp.task('tag-release', ['commit-release'], function () {
    git.tag(version, 'Release ' + version, function (err) {
        if (err) {
            throw err;
        }
    });
});

gulp.task('pub-release', ['test'], function () {
    return publish();
});
