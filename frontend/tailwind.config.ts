import type { Config } from 'tailwindcss'

const config: Config = {
  // Tell Tailwind to scan all these files for classes
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Or if using `src` directory:
    // './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        'dark-background': 'var(--color-dark-background)',
        highlight: 'var(--color-highlight)',
      },
    },
  },
  plugins: [],
}
export default config