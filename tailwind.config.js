const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import("@types/tailwindcss/tailwind-config").TailwindConfig } */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: '#696aad',
            dark: '#55568f',
            light: '#a0a2e6',
          },
          pink: {
            DEFAULT: '#eb6ea5',
            dark: '#c95587',
            light: '#f18fbb',
          },
          seafoam: {
            DEFAULT: '#78b9ab',
            light: '#8bcdbf',
          },
        },
      },
      fontFamily: {
        sans: ['"Inter var"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
  safelist: [
    {
      pattern: /[wh]-+/,
    },
  ],
}
