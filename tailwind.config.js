/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#040406',
          900: '#08080d',
          850: '#0c0c14',
          800: '#101019',
          750: '#14141f',
          700: '#1a1a28',
          600: '#22223a',
        },
        neon: {
          cyan: '#00f0ff',
          blue: '#0ab3ff',
          electric: '#00d4ff',
          aqua: '#22d3ee',
          ice: '#7dd3fc',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.15), 0 0 40px rgba(0, 240, 255, 0.05)',
        'neon-cyan-strong': '0 0 25px rgba(0, 240, 255, 0.35), 0 0 60px rgba(0, 240, 255, 0.12)',
        'neon-blue': '0 0 20px rgba(10, 179, 255, 0.15), 0 0 40px rgba(10, 179, 255, 0.05)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'scan-line': 'scan-line 4s linear infinite',
        'flicker': 'flicker 6s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '47%': { opacity: '1' },
          '48%': { opacity: '0.8' },
          '49%': { opacity: '1' },
          '72%': { opacity: '1' },
          '73%': { opacity: '0.4' },
          '74%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
