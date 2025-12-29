import type { Config } from 'tailwindcss'

const config: Config = {
  // Tell Tailwind to scan all these files for classes
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './safelist.txt',
    // Or if using `src` directory:
    // './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- OUR CUSTOM COLOR DEFINITIONS ---
        'primary': '#3A86FF', // Vibrant blue for primary actions
        'primary-darker': '#2A6AFF', // Slightly darker primary
        'secondary': '#FF006E', // Bright pink/magenta for accents
        'highlight': '#F7F7F7', // Very light color for elements needing high contrast on dark backgrounds
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