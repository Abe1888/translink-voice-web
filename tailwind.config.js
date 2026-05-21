/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: 'var(--brand-crimson)',
        accent: 'var(--accent)',
        white: 'var(--brand-white)',
        obsidian: 'var(--brand-obsidian)',
        'brand-cream': 'var(--brand-cream)',
        secondary: '#000000',
        // primary = brand-obsidian alias (used by TranslinkLanguageToggle text-primary / border-primary)
        primary: 'var(--brand-obsidian)',
      },
      fontSize: {
        'stat-value': 'var(--stat-value)',
        'stat-label': 'var(--stat-label)',
        'fluid-h1': 'var(--fluid-h1)',
        'fluid-p': 'var(--fluid-p)',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'bebas': ['Bebas Neue', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
        'syncopate': ['Syncopate', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
