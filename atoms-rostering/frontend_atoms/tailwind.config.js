/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Brand: AirNav navy scale (from #222E6A) ─────────────
        navy: {
          50: '#F1F3FA',
          100: '#E2E5F3',
          200: '#C6CCE8',
          300: '#9DA5D2',
          400: '#6F79AB',
          500: '#4A5488',
          600: '#333E73',
          700: '#222E6A',
          800: '#1A2452',
          900: '#141B3F',
          950: '#0D142E',
        },
        // ─── Single accent: amber ────────────────────────────────
        accent: {
          50: '#FEF9EC',
          100: '#FDF0D3',
          200: '#FAE0A6',
          300: '#F7CE6E',
          400: '#F5B23B',
          500: '#F5A623',
          600: '#D98A0F',
          700: '#B96E0E',
        },
        // ─── Legacy alias so existing `primary`/`secondary` classes resolve ──
        primary: {
          50: '#F1F3FA',
          100: '#E2E5F3',
          200: '#C6CCE8',
          300: '#9DA5D2',
          400: '#6F79AB',
          500: '#4A5488',
          600: '#333E73',
          700: '#222E6A',
          800: '#1A2452',
          900: '#141B3F',
        },
        secondary: {
          50: '#F1F3FA',
          100: '#E2E5F3',
          200: '#C6CCE8',
          300: '#9DA5D2',
          400: '#6F79AB',
          500: '#4A5488',
          600: '#333E73',
          700: '#222E6A',
          800: '#1A2452',
          900: '#141B3F',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        // One radius scale: controls lg (8), cards xl (12), surfaces 2xl (16)
        'surface': '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(20, 27, 63, 0.05), 0 1px 3px 0 rgba(20, 27, 63, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(20, 27, 63, 0.12), 0 2px 4px -2px rgba(20, 27, 63, 0.06)',
        modal: '0 10px 40px -6px rgba(20, 27, 63, 0.25)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
