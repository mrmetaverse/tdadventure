/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#0a0e14',
          panel: '#1a1f2e',
          border: '#2d3748',
          health: '#dc2626',
          mana: '#3b82f6',
          xp: '#fbbf24',
          text: '#e2e8f0',
        },
      },
      fontFamily: {
        game: ['"Press Start 2P"', 'cursive'],
      },
    },
  },
  plugins: [],
}


