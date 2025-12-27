import type { Config } from 'tailwindcss'

const config: Config = {
  // Tell Tailwind to scan all these files for classes
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- OUR CUSTOM COLOR DEFINITIONS ---
        'primary': '#FF473A', // High-energy red/orange for main buttons
        'primary-darker': '#E03D33',
        'secondary': '#3A7DFF', // Cool blue for accents
        'dark-background': '#1F2937', // Dark gray for the Header
        'background': '#F9FAFB', // Light off-white for the body
        'text-dark': '#111827', // Near-black for main text
        // ------------------------------------
      },
      // You can remove or keep the default gradient properties
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config