import { combineReducers } from 'redux';
// import sub reducers ...
import { routerReducer } from 'react-router-redux';

// Combine reducers with routeReducer which keeps track of
// router state
const rootReducer = combineReducers({
  // sub reducers ...
  routing: routerReducer
});

export default rootReducer;
