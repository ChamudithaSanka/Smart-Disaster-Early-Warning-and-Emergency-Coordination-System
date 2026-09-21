export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] },
    colors: { navy: '#12365e', navy2: '#0f2d50', teal: { DEFAULT: '#0b6f82', soft: '#dff1f4' }, page: '#eef2f7', ink: '#14213d', orange: { DEFAULT: '#e8590c' } },
    boxShadow: { card: '0 1px 3px rgba(16,42,67,.08), 0 1px 2px rgba(16,42,67,.04)' },
  } },
  plugins: [],
};
