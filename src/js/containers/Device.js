import React, { PropTypes } from 'react';
import { Link } from 'react-router';

const Device = ({ params }) => (
  <div>
    Device { params.deviceId }<br/>
    <Link to={'/'}>Home</Link><br/>
    <Link to={'/devices'}>Devices</Link>
  </div>
);

export default Device;
