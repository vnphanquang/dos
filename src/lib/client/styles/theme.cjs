/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  extend: {
    screens: {
      pc: {
        // personal computer (desktop)
        min: '768px',
      },
      sp: {
        // smartphone (mobile)
        max: '767px',
      },
    },
    fontFamily: {
      inter: ['Inter', 'sans-serif'],
    },
  },
};

module.exports = { theme };
