/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Disable preflight to avoid conflicts with MUI's baseline styles if needed, 
  // but for this strict design we might want more control. Keeping it off for now as requested.
  corePlugins: {
    preflight: false,
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'mono-black': '#000000',
        'mono-dark': '#0D0D0D',
        'mono-gray': '#333333',
        'mono-light': '#E5E5E5',
        'mono-accent': '#00FF00', // Neon Green
        'mono-dim': '#888888',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      boxShadow: {
        none: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
    },
  },
  plugins: [],
};
