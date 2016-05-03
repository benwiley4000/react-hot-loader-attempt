var path = require('path');
var gulp = require('gulp');
// var watch = require('watch');
var flip = require('css-flip');
var map = require('map-stream');
var gutil = require('gulp-util');
var browserSync = require('browser-sync');
var transform = require('vinyl-transform');
var child_process = require('child_process');

var argv = require('yargs').argv;

var sass = require('gulp-sass');
var bless = require('gulp-bless');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var minifycss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');

var WebpackDevServer = require('webpack-dev-server');
var webpack = require('webpack-stream');
var dwebpack = require('webpack');

var runSequence = require('run-sequence');

var createRTL = argv.rtl ? true : false;
var production = argv.production ? true : false;
var port = argv.port ? argv.port : 8080;
var wport = argv.wport ? argv.wport : 8079;
var whost = argv.whost ? argv.whost : 'localhost';

/* file patterns to watch */
var paths = {
  index: ['src/index.html', 'server.js'],
  // l20n: ['src/global/vendor/l20n/*.jsx'],
  js: ['src/js/**/*.js'],
  scss: ['src/sass/**/*.scss']
};

function logData() {
  gutil.log(
    gutil.colors.bold(
      gutil.colors.blue.apply(this, arguments)
    )
  );
}

logData('RTL  :', (createRTL ? 'yes':'no'));
logData('PORT :', port);
logData('WEBPACK DEV SERVER PORT :', wport);
logData('WEBPACK DEV SERVER HOST :', whost);
logData('Environment :', (production ? 'Production':'Development'));

/* ---------------------------------- */
/* --------- BEGIN APP:SASS --------- */
/* ---------------------------------- */
gulp.task('sass:app', function() {
  return gulp.src('./src/sass/*.scss')
          .pipe(concat('main.scss'))
          .pipe(sass({
            // sourceComments: 'normal' // uncomment when https://github.com/sass/node-sass/issues/337 is fixed
          }).on('error', sass.logError))
          .pipe(autoprefixer('last 2 versions', '> 1%', 'ie 9'))
          .pipe(insert.prepend('@charset "UTF-8";\n'))
          .pipe(gulp.dest('public/css/raw/ltr'))
          .pipe(browserSync.reload({stream:true}));
});

gulp.task('sass:app:rtl', ['sass:app'], function() {
  if(!createRTL) return null;
  var flipStylesheet = transform(function(filename) {
    return map(function(chunk, next) {
      return next(null, flip(chunk.toString()));
    });
  });
  return gulp.src('public/css/raw/ltr/*.css')
          .pipe(flipStylesheet)
          .pipe(gulp.dest('public/css/raw/rtl'))
          .pipe(browserSync.reload({stream:true}));
});

gulp.task('minifycss:app', function() {
  return gulp.src(['public/css/raw/ltr/*.css'])
          .pipe(minifycss())
          .pipe(gulp.dest('public/css/min/ltr'));
});

gulp.task('minifycss:app:rtl', function() {
  if(!createRTL) return null;
  return gulp.src(['public/css/raw/rtl/*.css'])
        .pipe(minifycss())
        .pipe(gulp.dest('public/css/min/rtl'));
});

gulp.task('bless:app', function() {
  return gulp.src('public/css/min/ltr/*.css')
          .pipe(bless())
          .pipe(insert.prepend('@charset "UTF-8";\n'))
          .pipe(gulp.dest('public/css/blessed/ltr'));
});

gulp.task('bless:app:rtl', function() {
  if(!createRTL) return null;
  return gulp.src('public/css/min/rtl/*.css')
          .pipe(bless())
          .pipe(insert.prepend('@charset "UTF-8";\n'))
          .pipe(gulp.dest('public/css/blessed/rtl'));
});
/* -------------------------------- */
/* --------- END APP:SASS --------- */
/* -------------------------------- */

/* ----------------------------------------- */
/* ------------ BEGIN REACT.L20n ----------- */
/* ----------------------------------------- */
/*
gulp.task('react:react-l20n', function() {
  return gulp.src('./src/global/vendor/l20n/index.jsx')
          .pipe(webpack({
            cache: true,
            module: {
              loaders: [
                {test: /\.jsx$/, loader: 'babel-loader?stage=1&compact=false'}
              ]
            }
          }))
          .pipe(rename('react-l20n.js'))
          .pipe(gulp.dest('public/js/common/react-l20n'));
});

gulp.task('uglify:react-l20n', function() {
  return gulp.src('public/js/common/react-l20n/react-l20n.js')
          .pipe(uglify({
            preserveComments: false,
            compress: {
              warnings: false
            }
          }))
          .pipe(rename('react-l20n.min.js'))
          .pipe(gulp.dest('public/js/common/react-l20n'));
});
*/
/* --------------------------------------- */
/* ----------- END REACT.L20n ------------ */
/* --------------------------------------- */

var webpackConfig = function() {
  return {
    cache: true,
    module: {
      loaders: [
        {test: /\.txt$/,
         exclude: /(node_modules|bower_components)/,
         loaders: ['babel']},
        {test: /\package\.json$/,
         exclude: /(node_modules|bower_components)/,
         loaders: ['json']},
        {test: /[\\\\|\/]src[\\\\|\/]jsx[\\\\|\/](.*?)\.txt$/,
         exclude: /(node_modules|bower_components)/,
         loaders: ['raw']},
        {test: /[\\\\|\/]src[\\\\|\/]jsx[\\\\|\/](.*?)\.json$/,
         exclude: /(node_modules|bower_components)/,
         loaders: ['json']},
        {test: /[\.jsx|\.js]$/,
         exclude: /(node_modules|bower_components)/,
         loader: 'babel',
         query: {
           cacheDirectory: true,
           compact: false,
           presets: ['es2015', 'react', 'stage-0'],
           plugins: ['react-hot-loader/babel']
         }}
      ]
    },
    resolve: {
      extensions: ['', '.js', '.jsx'],
      fallback: path.join(__dirname, 'node_modules')
    },
    resolveLoader: {
      fallback: path.join(__dirname, 'node_modules')
    },
    plugins: [
      new dwebpack.NoErrorsPlugin()
    ],
    node: {
      net : 'mock',
      dns : 'mock'
    }
  };
};

/* --------------------------------- */
/* ---------- BEGIN APP:JS --------- */
/* --------------------------------- */
gulp.task('react:development:server', function() {
  var wconfig = webpackConfig();
  wconfig.entry = [
    'webpack-dev-server/client?http://'+whost+':'+wport,
    'webpack/hot/only-dev-server',
    './src/js/index.js'
  ];
  wconfig.output = {
    path: process.cwd(),
    contentBase: 'http://'+whost+':'+wport,
    filename: 'bundle.js',
    publicPath: 'http://'+whost+':'+wport+'/scripts/'
  };
  wconfig.plugins = wconfig.plugins.concat([
    new dwebpack.HotModuleReplacementPlugin()
  ]);

  var server = new WebpackDevServer(dwebpack(wconfig), {
    publicPath: wconfig.output.publicPath,
    hot: true,
    inline: true,
    stats: {
      colors: true,
      progress: true
    }
  });

  server.listen(wport, function (err, result) {
    if (err) {
      console.log(err);
    }

    gutil.log('Webpack Dev Server started. Compiling...');
  });
});

/*
gulp.task('react:development', function() {
  var wconfig = webpackConfig();
  wconfig.target = 'node';
  wconfig.output = {
   libraryTarget: 'commonjs2'
  };

  return gulp.src('src/js/index.js')
          .pipe(webpack(wconfig))
          .pipe(rename('index.node.js'))
          .pipe(gulp.dest('public/js/'));
});
*/

gulp.task('react:app', function() {
  var wconfig = webpackConfig();
  return gulp.src('src/js/index.js')
          .pipe(webpack(wconfig))
          .pipe(rename('index.js'))
          .pipe(gulp.dest('public/js/'));
});

gulp.task('react:app:uglify', ['react:app'], function() {
  return gulp.src('public/js/index.js')
          .pipe(uglify({
            preserveComments: false,
            compress: {
              warnings: false
            }
          }))
          .pipe(rename('index.min.js'))
          .pipe(gulp.dest('public/js/'));
});

gulp.task('react:app:build', [
  'react:app',
  'react:app:uglify'
]);
/* ------------------------------- */
/* ---------- END APP:JS --------- */
/* ------------------------------- */

/* --------------------------------- */
/* --------- BEGIN EXPRESS --------- */
/* --------------------------------- */
var child = null, browserSyncConnected = false;
gulp.task('express', function() {
  if(child) child.kill();
  child = child_process.spawn(process.execPath, ['./start.js'], {
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      RTL: createRTL,
      PORT: 3000,
      WPORT: wport,
      WHOST: whost
    },
    stdio: ['ipc']
  });
  child.stdout.on('data', function(data) {
    gutil.log(gutil.colors.bgCyan(gutil.colors.blue(data.toString().trim())));
  });
  child.stderr.on('data', function(data) {
    gutil.log(gutil.colors.bgRed(gutil.colors.white(data.toString().trim())));
    browserSync.notify('ERROR: ' + data.toString().trim(), 5000);
  });
  child.on('message', function(m) {
    if(m === 'CONNECTED' && !browserSyncConnected) {
      gutil.log(gutil.colors.bgMagenta(gutil.colors.white('Server spawned! Starting proxy...')));
      browserSync({
        proxy: 'localhost:3000',
        port: port
      }, function() {
        browserSyncConnected = true;
      });
    } else {
      browserSync.notify(m, 5000);
    }
  });
});

process.on('uncaughtException', function(err) {
  if(child) child.kill();
  throw new Error(err);
});
/* ------------------------------- */
/* --------- END EXPRESS --------- */
/* ------------------------------- */

/* ------------------------------- */
/* -------- BEGIN NOTIFY --------- */
/* ------------------------------- */
gulp.task('notify', function() {
  browserSync.notify('Live reloading ...');
});
/* ------------------------------- */
/* ---------- END NOTIFY --------- */
/* ------------------------------- */

/* ------------------------------------ */
/* -------- BEGIN BROWSERSYNC --------- */
/* ------------------------------------ */
/*
var createMonitor = function() {
  var callback = function(f) {
    browserSync.reload(f);
  };

  return function(p) {
    watch.createMonitor(p, function(m) {
      m.on('created', callback);
      m.on('changed', callback);
      m.on('removed', callback);
    });
  }
}

if(!production) {
  var m = createMonitor();
  m('public/imgs');
  m('public/locales');
}
*/

/* ------------------------------------ */
/* ---------- END BROWSERSYNC --------- */
/* ------------------------------------ */

/* ------------------------------ */
/* --------- GULP TASKS --------- */
/* ------------------------------ */
gulp.task('sass', ['sass:app:rtl']);
// gulp.task('react-l20n', ['react:react-l20n']);
gulp.task('build:app', [/*'uglify:react-l20n', */'react:app:build'/*, 'react:development'*/]);
gulp.task('minifycss', ['minifycss:app', 'minifycss:app:rtl']);
gulp.task('bless', ['bless:app', 'bless:app:rtl']);

gulp.task('build:css', ['sass']);
gulp.task('build:essentials', [/*'react-l20n'*/]);

gulp.task('build:dev', ['build:css', 'build:essentials']);
gulp.task('build:dist', ['minifycss', 'bless', 'build:app']);

if(production) {
  logData('Building please wait...');
  gulp.task('default', function(callback) {
    runSequence('build:css', 'build:essentials', 'minifycss', 'bless', 'build:app', function() {
      callback();
      gutil.log(
        gutil.colors.bgMagenta(
          gutil.colors.red(
            gutil.colors.bold('[          COMPLETED BUILD PROCESS          ]')
          )
        )
      );
    });
  });
} else {
  gulp.task('default', function(callback) {
    runSequence('react:development:server', /*'react:development', */'build:css', 'build:essentials', ['express', 'watch'], callback);
  });
}

gulp.task('development', function(callback) {
  runSequence(/*'react:development', */'react:app', 'notify', 'express:watch', callback);
});

/*BEGIN: ALIASES FOR CERTAIN TASKS (for Watch)*/
// gulp.task('react-l20n:watch', ['react-l20n'], ready);
gulp.task('build:css:watch', ['build:css'], ready);
gulp.task('express:watch', ['express'], ready);
gulp.task('rebuild:css', ['build:css'], ready);
/*END: ALIASES*/

gulp.task('watch', function() {
  gulp.watch(paths.index, ['express:watch']);
  // gulp.watch(paths.l20n, ['react-l20n:watch']);
  gulp.watch(paths.scss, ['rebuild:css']);
  gulp.watch(paths.js.concat(paths.scss), ['development']);
});

function ready() {
  gutil.log(
    gutil.colors.bgMagenta(
      gutil.colors.white(
        gutil.colors.bold('[          STATUS: READY          ]')
      )
    )
  );
}
