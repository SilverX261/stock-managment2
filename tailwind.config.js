/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* ── Brand tokens ── */
        brand: {
          orange:  '#F97316',
          'orange-dark': '#EA580C',
          teal:    '#0D9488',
          'teal-light': '#CCFBF1',
          'orange-light': '#FFF7ED',
          'orange-mid':  '#FFEDD5',
        },
        /* ── Surface tokens ── */
        surface: {
          page:   '#FAFAF8',
          card:   '#FFFFFF',
          border: '#F0EEE8',
          sidebar:'#0A0A0A',
        },
        zinc: {
          400: '#A1A1AA',
          700: '#3F3F46',
          900: '#18181B',
          950: '#09090B',
        },
      },
      borderRadius: {
        card: '20px',
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card:       '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.10)',
        'orange':   '0 4px 14px rgba(249,115,22,0.30)',
        'orange-lg':'0 8px 24px rgba(249,115,22,0.40)',
        'teal':     '0 4px 14px rgba(13,148,136,0.25)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
