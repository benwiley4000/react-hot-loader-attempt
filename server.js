import fs from 'fs';
import path from 'path';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import renderAppMarkup from './renderAppMarkup';

const app = express();
app.use(compression());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'public')));

const webpack_host = process.env.WHOST ? process.env.WHOST : 'localhost';
const webpack_dev_server_port = process.env.WPORT ? process.env.WPORT : 8079;

let html = fs.readFileSync(path.join(process.cwd(), 'src', 'index.html'), {
  encoding: 'utf8'
});

const createStyleTag = (file, media) => {
  media = media || 'screen';
  return "    <link media='"+media+"' rel='stylesheet' type='text/css' href='"+file+"'>\n";
};

let stylesheets = '';
if(process.env.NODE_ENV === 'development') {
  stylesheets += createStyleTag('/css/raw/{dir}/main.css', 'screen,print');
  html = html.replace(new RegExp('{appscript}', 'g'), 'http://'+webpack_host+':'+webpack_dev_server_port+'/scripts/bundle.js');
  html = html.replace(new RegExp('{__DEVCLIENT__}', 'g'), 'true');
} else {
  // stylesheets += createStyleTag('/css/'+defaultAppName+'/blessed/{dir}/main-blessed1.css', 'screen,print');
  stylesheets += createStyleTag('/css/blessed/{dir}/main.css', 'screen,print');
  html = html.replace(new RegExp('{appscript}', 'g'), '/js/index.min.js');
  html = html.replace(new RegExp('{__DEVCLIENT__}', 'g'), 'false');
}

html = html.replace(new RegExp('{stylesheets}', 'g'), stylesheets);

const ltr = html.replace(new RegExp('{dir}', 'g'), 'ltr');
const rtl = html.replace(new RegExp('{dir}', 'g'), 'rtl');

app.get('/ltr', (req, res, next) => {
  res.redirect('/');
});

app.get('/rtl', (req, res, next) => {
  res.redirect('/');
});

/** CATCH-ALL ROUTE **/
app.get('*', (req, res, next) => {
  if(req.url === '/favicon.ico'
    || (req.url.search('.l20n') !== -1)) return next();
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  const isRTL = false; // FIX LATER // req.cookies.rubix_dir === 'rtl' ? true : false;

  renderAppMarkup(req.path, (err, data) => {
    if (err) {
      res.status(err.status).end(err.message);
    } else if (!data) {
    } else if (data.responseType === 'redirect') {
      res.redirect(302, data.pathname + data.search);
    } else if (data.responseType === 'markup') {
      const appHTML = data.componentHTML;
      const state = JSON.stringify(data.initialState);
      if(isRTL) {
        res.end(
          rtl.replace(new RegExp('{container}', 'g'), appHTML)
             .replace(new RegExp('{__INITIAL_STATE__}', 'g'), state)
        );
      } else {
        res.end(
          ltr.replace(new RegExp('{container}', 'g'), appHTML)
             .replace(new RegExp('{__INITIAL_STATE__}', 'g'), state)
        );
      }
    }
    return next();
  });
});

const server = app.listen(process.env.PORT || 8080, () => {
  try {
    process.send('CONNECTED');
  } catch(e) {}
});

process.on('uncaughtException', (err) => {
  console.log(arguments);
  process.exit(-1);
});
