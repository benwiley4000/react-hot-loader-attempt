import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';

const Root = ({ store, history, onUpdate, routes }) => (
  <Provider store={store}>
    <Router history={history} onUpdate={onUpdate}>
      {routes}
    </Router>
  </Provider>
);

export default Root;
