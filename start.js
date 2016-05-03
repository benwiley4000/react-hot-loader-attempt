global.__DEVCLIENT__ = false;
global.__DEVSERVER__ = process.env.NODE_ENV === 'development';

require('babel-core/register');
require('./server');
