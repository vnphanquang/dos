require('../postcss/css-node-loader.cjs');

const components = {
  // HYGEN INJECTION MARKER
  ...require('./graphic.css'),
};

module.exports = { components };
