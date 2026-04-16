/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#00E5FF',
        secondary: '#FFB6C1',
        tertiary: '#FFD700',
        danger: '#FF6B6B',
        success: '#48BB78',
        info: '#4299E1',
        purple: '#9F7AEA',
        background: '#F7F9FC',
        surface: '#FFFFFF',
        'surface-dark': '#2D3748',
        'background-dark': '#1A202C',
        text: '#2D3748',
        'text-muted': '#718096',
        'text-dark': '#F7F9FC',
        'text-muted-dark': '#A0AEC0',
        border: '#E2E8F0',
      },
      fontFamily: {
        display: ['Nunito'],
        'display-bold': ['Nunito-Bold'],
        'display-extrabold': ['Nunito-ExtraBold'],
        'display-semibold': ['Nunito-SemiBold'],
        functional: ['Outfit_400Regular'],
        'functional-medium': ['Outfit_500Medium'],
        'functional-semibold': ['Outfit_600SemiBold'],
        'functional-bold': ['Outfit_700Bold'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'badge': '0 4px 10px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
