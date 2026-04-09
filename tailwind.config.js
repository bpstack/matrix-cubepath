/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/frontend/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matrix: {
          bg: 'rgb(var(--matrix-bg) / <alpha-value>)',
          surface: 'rgb(var(--matrix-surface) / <alpha-value>)',
          border: 'rgb(var(--matrix-border) / <alpha-value>)',
          accent: 'rgb(var(--matrix-accent) / <alpha-value>)',
          'accent-hover': 'rgb(var(--matrix-accent-hover) / <alpha-value>)',
          success: 'rgb(var(--matrix-success) / <alpha-value>)',
          warning: 'rgb(var(--matrix-warning) / <alpha-value>)',
          danger: 'rgb(var(--matrix-danger) / <alpha-value>)',
          muted: 'rgb(var(--matrix-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '20px'],
        base: ['14px', '20px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
      },
    },
  },
  plugins: [],
};
