const gulp = require('gulp');
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const terser = require('gulp-terser');

gulp.task('default', () => {
    return gulp.src('src/**/*.js')
        .pipe(plumber())
        .pipe(jshint({'esversion': 8}))
        .pipe(replace(/import.+;/g, ''))
        .pipe(replace('export', ''))
        .pipe(concat('console-casino.js'))
        .pipe(terser())
        .pipe(rename('console-casino.min.js'))
        .pipe(gulp.dest('./dist'))
});