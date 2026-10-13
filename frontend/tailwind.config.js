/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070B14',
        surface: '#0B1120',
        panel: '#111827',
        glass: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.10)',
        accent: '#3B82F6',
        accent2: '#8B5CF6',
        cyan: '#06B6D4',
        success: '#22C55E',
        warn: '#F59E0B',
        danger: '#EF4444',
        text: '#F8FAFC',
        muted: '#94A3B8',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(59,130,246,0.2), 0 12px 30px rgba(59,130,246,0.15)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
