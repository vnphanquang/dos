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
    colors: {
      condition: {
        recovered: {
          bg: 'theme("colors.green.100")',
          fg: 'theme("colors.green.500")',
        },
        mild: {
          bg: 'theme("colors.yellow.100")',
          fg: 'theme("colors.yellow.500")',
        },
        critical: {
          bg: 'theme("colors.red.100")',
          fg: 'theme("colors.red.500")',
        },
        dead: {
          bg: 'theme("colors.black / 50%")',
          fg: 'black',
        },
      },
    },
    fontFamily: {
      inter: ['Inter', 'sans-serif'],
    },
  },
};

module.exports = { theme };
