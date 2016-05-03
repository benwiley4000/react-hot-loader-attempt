/**
* This looks at static needs parameter in components and waits for the promise to be fullfilled
* It is used to make sure server side rendered pages wait for APIs to resolve before returning res.end()
* As seen in: https://github.com/caljrimmer/isomorphic-redux-app
*/

/* Found secondhand at:
 * https://github.com/choonkending/react-webpack-node/blob/master/app/api/fetchComponentDataBeforeRender.js
 */

const fetchComponentDataBeforeRender = (dispatch, components, params) => {
  const needs = components.reduce((prev, current) => {
    return (current.need || []).concat(prev);
  }, []);
  const promises = needs.map(need => dispatch(need(params)));
  return Promise.all(promises);
};

export default fetchComponentDataBeforeRender;
