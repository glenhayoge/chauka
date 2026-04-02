/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Functional status colors only — no decorative palette
        danger: '#dc2626',
        warning: '#f59e0b',
        ok: '#16a34a',
      },
    },
  },
  plugins: [],
}
