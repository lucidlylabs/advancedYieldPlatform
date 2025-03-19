// tailwind.config.js
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx}',
      './src/components/**/*.{js,ts,jsx,tsx}',
      './src/features/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          // Based on your Figma's dark theme
          background: {
            DEFAULT: '#0A0B11', // Main background
            secondary: '#141523', // Card background
          },
          primary: {
            DEFAULT: '#4A46FF', // Primary accent color
            hover: '#615EFF',
          },
          secondary: {
            DEFAULT: '#6E56CF',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#A7A7C5',
            muted: '#777790',
          },
          asset: {
            eth: '#627EEA', // Ethereum blue
            btc: '#F7931A', // Bitcoin orange
            usd: '#9F5FF2', // USD purple
          },
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'], // Update with your font
        },
        fontSize: {
          // Match your Figma type scale
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
          '4xl': '2.5rem',
        },
        borderRadius: {
          DEFAULT: '0.5rem',
          lg: '1rem',
        },
      },
    },
    plugins: [],
  };