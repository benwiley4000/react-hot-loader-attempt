import React, { PropTypes } from 'react';
import { Link } from 'react-router';

const Devices = () => (
  <div>
    Devices<br/>
    <Link to={'/'}>Home</Link><br/>
    <Link to={'/devices'}>Devices</Link>
  </div>
);

export default Devices;
