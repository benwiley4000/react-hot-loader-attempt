import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './containers/App';
import Home from './containers/Home';
import Devices from './containers/Devices';
import Device from './containers/Device';

/*
 * @param {Redux Store}
 * We require store as an argument here because we wish to get
 * state from the store after it has been authenticated.
 */
const createRoutes = (store) => {
  return (
    <Route path="/" component={App}>
      <IndexRoute component={Home} />
      <Route path="devices" component={Devices} />
      <Route path="devices/:deviceId" component={Device} />
    </Route>
  );
};

export default createRoutes;
