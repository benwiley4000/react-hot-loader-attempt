import React, { PropTypes } from 'react';

const App = ({ children }) => {
  return (
    <div>
      <h1>Hello World!</h1>
      {children}
    </div>
  );
};

App.propTypes = {
  children: PropTypes.object
};

export default App;
