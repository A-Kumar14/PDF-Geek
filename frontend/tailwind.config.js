/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Disable preflight to avoid conflicts with MUI's baseline styles
  corePlugins: {
    preflight: false,
  },
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
