const app = require('./src/lib/client/styles/postcss/tailwind.cjs');

/** @type {import("tailwindcss").Config } */
const config = {
  darkMode: '',
  content: ['./src/**/*.{html,js,svelte,ts,md}', 'svelte.config.js'],
  plugins: [app, require('daisyui')],
  daisyui: {
    prefix: 'd-',
  },
};

module.exports = config;
