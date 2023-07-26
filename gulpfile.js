const gulp = require('gulp');
const { sassSync } = require("@mr-hope/gulp-sass");
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');

const reload = browserSync.reload;

// CSS
function style() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sassSync({
            outputStyle: 'expanded'
        }).on('error', sassSync.logError))
        // .pipe(rename('./sty.css'))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./css'));
}

// SVG sprite
function svgSprite() {
    return gulp.src('./icons/*.svg')
        .pipe(rename({ prefix: 'icon-' }))
        .pipe(svgmin({
                multipass: true,
                plugins: [
                    {
                        removeViewBox: false,
                        removeDimensions: true
                    }
                ]
            }
        ))
        .pipe(svgstore())
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                // $('[fill]').each(function() {
                //     if ($(this).attr('fill') !== 'currentColor' || $(this).attr('fill') !== 'currentcolor') {
                //         $(this).attr('fill', 'currentColor');
                //     }
                // });
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(rename('icons-sprite.svg'))
        .pipe(gulp.dest('./img'));
}

// Watch
// server: true     -> serve files from the current directory
// open: false      -> stop the browser from automatically opening
// ghostMode: false -> prevent Clicks, Scrolls & Form inputs on any device to be mirrored to all others
// https: true
function watch() {
    browserSync.init({
        server: true,
        open: false,
        ghostMode: false
    });
    gulp.watch('./icons/*.svg', svgSprite);
    gulp.watch('./scss/**/*.scss', style)
    gulp.watch('./css/**/*.css').on('change', reload);
    gulp.watch('./*.html').on('change', reload);
    gulp.watch('./js/**/*.js').on('change', reload);
};

exports.svg = svgSprite;
exports.default = watch;