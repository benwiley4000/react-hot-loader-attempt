/* Based on:
 * https://github.com/choonkending/react-webpack-node/blob/master/app/client.jsx
 */

import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import createRoutes from './routes';
import configureStore from './store/configureStore';
import fetchComponentDataBeforeRender from './api/fetchComponentDataBeforeRender';
import Root from './root';

// Grab the state from a global injected into
// server-generated HTML
const initialState = window.__INITIAL_STATE__;

const store = configureStore(initialState, browserHistory);
const history = syncHistoryWithStore(browserHistory, store);
const routes = createRoutes(store);

/**
 * Callback handling route changes.
 */
function onUpdate () {
  // Prevent duplicate fetches when first loaded.
  // Explanation: On server-side render, we already have __INITIAL_STATE__
  // So when the client side onUpdate kicks in, we do not need to fetch twice.
  // We set it to null so that every subsequent client-side navigation will
  // still trigger a fetch data.
  // Read more: https://github.com/choonkending/react-webpack-node/pull/203#discussion_r60839356
  if (window.__INITIAL_STATE__ !== null) {
    window.__INITIAL_STATE__ = null;
    return;
  }
  // NOTE: onUpdate must NOT be an ES6 arrow function,
  // since proper 'this' isn't available until execution.
  const { state: { components, params } } = this;
  fetchComponentDataBeforeRender(store.dispatch, components, params);
}

render(
  <AppContainer>
    <Root {...{ store, history, onUpdate, routes }} />
  </AppContainer>,
  document.getElementById('app')
);

if (module.hot) {
  module.hot.accept('./root', () => {
    const NextRoot = require('./root').default;
    render(
      <AppContainer>
        <NextRoot {...{ store, history, onUpdate, routes }} />
      </AppContainer>,
      document.getElementById('app')
    );
  });
}
