/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Brand: AirNav navy scale (from #1B3A6B) ─────────────
        brand: {
          primary: '#1B3A6B',
          secondary: '#F5A623',
          50: '#EEF2F8',
          100: '#DCE4F0',
          200: '#B4C3DC',
          300: '#7F97BF',
          400: '#4F6C9E',
          500: '#2F4D82',
          600: '#1B3A6B',
          700: '#162F57',
          800: '#102442',
          900: '#0C1B33',
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
        sidebar: {
          DEFAULT: '#222E6A',
          active: '#454D7C',
          hover: '#2d3a7a',
        },
        maintenance: {
          cnsd: '#1B5E82',
          tfp: '#1A5C34',
          wo: '#6D28D9',
          normal: '#10B981',
          abnormal: '#EF4444',
          warning: '#F59E0B',
          soon: '#9CA3AF',
        },
        // Status color tokens for badges and indicators
        status: {
          blue: {
            bg: '#DBEAFE',      // bg-blue-100
            text: '#1D4ED8',    // text-blue-700
            dot: '#3B82F6',     // bg-blue-500
            ring: '#2563EB33',  // ring-blue-600/20
          },
          amber: {
            bg: '#FEF3C7',      // bg-amber-100
            text: '#B45309',    // text-amber-700
            dot: '#F59E0B',     // bg-amber-500
            ring: '#D9770633',  // ring-amber-600/20
          },
          orange: {
            bg: '#FFEDD5',      // bg-orange-100
            text: '#C2410C',    // text-orange-700
            dot: '#F97316',     // bg-orange-500
            ring: '#EA580C33',  // ring-orange-600/20
          },
          green: {
            bg: '#D1FAE5',      // bg-green-100
            text: '#15803D',    // text-green-700
            dot: '#22C55E',     // bg-green-500
            ring: '#16A34A33',  // ring-green-600/20
          },
          red: {
            bg: '#FEE2E2',      // bg-red-100
            text: '#B91C1C',    // text-red-700
            dot: '#EF4444',     // bg-red-500
            ring: '#DC262633',  // ring-red-600/20
          },
          slate: {
            bg: '#F1F5F9',      // bg-slate-100
            text: '#475569',    // text-slate-600
            dot: '#94A3B8',     // bg-slate-400
            ring: '#64748B33',  // ring-slate-500/20
          },
          indigo: {
            bg: '#E0E7FF',      // bg-indigo-100
            text: '#3730A3',    // text-indigo-800
            dot: '#6366F1',     // bg-indigo-500
            ring: '#4F46E533',  // ring-indigo-600/20
          },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(12, 27, 51, 0.05), 0 1px 3px 0 rgba(12, 27, 51, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(12, 27, 51, 0.12), 0 2px 4px -2px rgba(12, 27, 51, 0.06)',
        modal: '0 10px 40px -6px rgba(12, 27, 51, 0.25)',
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
  plugins: [],
}
