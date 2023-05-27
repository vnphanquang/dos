---
to: "<%= category === 'mixin' ? `src/lib/client/styles/globals/mixins/${name}.cjs` : null %>"
unless_exists: true
---
// const postcss = require('postcss');

/**
 * @param {import('postcss').Container<import('postcss').ChildNode>} mixin
 */
function test(_mixin) {
  //
}

module.exports = { test };