# HTML Boilerplate
A basic HTML template, SASS &amp; JS ready.


## Installation
### 1) Update `package.json` infos

### 2) Packages

```zsh
npm install
```

### 3) Reinit Git repository

```zsh
rm -rf .git
git init
git add .
git commit -m "first commit"
git branch -M main
```
### 4) Use it!

```zsh
gulp
```
Usually the server starts at : [http://localhost:3001/](http://localhost:3002/)

## SVG sprites

Individual icon files are placed in the `/icons/` folder. The name of each file, prefixed with `icon-`, sets the `id` of the associated `<symbol>`.

To generate the sprite (`/img/icons-sprite.svg`) :

```bash
gulp svg
```
Sprite's generation is included in the default task : adding a SVG file in the `/icons/` folder leads to a brand new ~~cadillac~~ sprite.

### `svgstore` : generate SVG sprites

[GitHub Repository](https://github.com/w0rm/gulp-svgstore)

The following options are set automatically based on file data:

- `id` attribute of the `<symbol>` element is set to the name of corresponding file
- result filename is the __name of base directory of the first file__.

If your workflow is different, please use `gulp-rename` to rename sources or result.

The only available option is:

- `inlineSvg` — output only `<svg>` element without `<?xml ?>` and `DOCTYPE` to use inline, __default: `false`__.

### SVG Optimization with `svgmin`

- [GitHub Repository](https://github.com/ben-eb/gulp-svgmin)

__Note__ Relies on [`SVGO`](https://github.com/svg/svgo), which is globally installed.

### Remove unnecessary `fill` attributes

Thanks to [gulp-cheerio](https://github.com/knpwrs/gulp-cheerio)

[Cheerio](https://github.com/cheeriojs/cheerio) is an implementation of jQuery for the server, it makes it easy to remove SVG attributes : 

```javascript
$("[fill]").removeAttr("fill");
```
__NB__: It's also possible to replace the value of every `fill` attribute with `currentColor`. Thus the `fill` color of the path is controlled via CSS with the `color` property of the parent `svg`.

## Links

Installed plugins :

- [@mr-hope/gulp-sass](https://github.com/Mister-Hope/gulp-sass) (fully compatible with [Dart Sass](https://sass-lang.com/dart-sass))
- [gulp-rename](https://github.com/hparra/gulp-rename)
- [gulp-autoprefixer](https://github.com/sindresorhus/gulp-autoprefixer)
- [gulp-sourcemaps](https://github.com/gulp-sourcemaps/gulp-sourcemaps)
- [browser-sync](https://browsersync.io/docs/gulp)

