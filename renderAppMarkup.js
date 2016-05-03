/* Based on:
 * https://github.com/choonkending/react-webpack-node/blob/master/app/server.jsx
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { RouterContext, match, createMemoryHistory } from 'react-router';
import { Provider } from 'react-redux';

import createRoutes from './src/js/routes';
import configureStore from './src/js/store/configureStore';
import fetchComponentDataBeforeRender from './src/js/api/fetchComponentDataBeforeRender';

const renderAppMarkup = (url, callback) => {
  const history = createMemoryHistory();
  const store = configureStore({
    // fill in initial state later
  }, history);

  const routes = createRoutes(store);

  /*
   * From the react-router docs:
   *
   * This function is to be used for server-side rendering. It matches a set of routes to
   * a location, without rendering, and calls a callback(error, redirectLocation, renderProps)
   * when it's done.
   *
   * The function will create a `history` for you, passing additional `options` to create it.
   * These options can include `basename` to control the base name for URLs, as well as the pair
   * of `parseQueryString` and `stringifyQuery` to control query string parsing and serializing.
   * You can also pass in an already instantiated `history` object, which can be constructured
   * however you like.
   *
   * The three arguments to the callback function you pass to `match` are:
   * - error: A javascript Error object if an error occured, `undefined` otherwise.
   * - redirectLocation: A `Location` object if the route is a redirect, `undefined` otherwise
   * - renderProps: The props you should pass to the routing context if the route matched, `undefined`
   *                otherwise.
   * If all three parameters are `undefined`, this means that there was no route found matching the
   * given location.
   */
  match({ routes, location: url }, (error, redirectLocation, renderProps) => {
    if (error) {
      callback({
        message: 'Internal Error',
        status: 500
      });
    } else if (redirectLocation) {
      callback(null, {
        responseType: 'redirect',
        pathname: redirectLocation.pathname,
        search: redirectLocation.search
      });
    } else if (renderProps) {
      const InitialView = (
        <Provider store={store}>
          <RouterContext {...renderProps} />
        </Provider>
      );

      // This method waits for all render component promises to resolve before returning to browser
      fetchComponentDataBeforeRender(store.dispatch, renderProps.components, renderProps.params)
      .then(() => {
        callback(null, {
          responseType: 'markup',
          componentHTML: renderToString(InitialView),
          initialState: store.getState()
        });
      })
      .catch((err) => {
        callback({
          message: err.message,
          status: 500
        });
      });
    } else {
      callback({
        message: 'Not Found',
        status: 404
      });
    }
  });
};

export default renderAppMarkup;
