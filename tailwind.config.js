/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx}', './Screens/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
