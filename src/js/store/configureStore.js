/* Borrowed from:
 * https://github.com/choonkending/react-webpack-node/blob/master/app/store/configureStore.js
 */

import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import rootReducer from '../reducers';
import promiseMiddleware from '../api/promiseMiddleware';

const configureStore = (initialState, history) => {
  // Installs hooks that always keep react-router and redux
  // store in sync
  const middleware = [thunk, promiseMiddleware, routerMiddleware(history)];
  if (__DEVCLIENT__) {
    middleware.push(createLogger());
  }

  const store = createStore(rootReducer, initialState, compose(
    applyMiddleware(...middleware),
    typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
  ));

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers');
      store.replaceReducer(nextReducer);
    });
  }

  return store;
};

export default configureStore;
