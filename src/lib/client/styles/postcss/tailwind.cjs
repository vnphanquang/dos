// const postcss = require('postcss');
const plugin = require('tailwindcss/plugin');

const { components } = require('../components/index.cjs');
const { theme } = require('../theme.cjs');

module.exports = plugin(
  ({ addComponents, addUtilities }) => {
    addComponents(components);

    addUtilities({
      '.square': {
        'aspect-ratio': '1 / 1',
        'min-height': '0',
        'min-width': '0',
      },
    });
  },
  { theme },
);
