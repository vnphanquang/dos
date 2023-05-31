require('../postcss/css-node-loader.cjs');

const components = {
  // HYGEN INJECTION MARKER
  ...require('./page.css'),
};

module.exports = { components };
