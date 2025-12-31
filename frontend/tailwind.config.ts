import type { Config } from 'tailwindcss'

const config: Config = {
  // Tell Tailwind to scan all these files for classes
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}', // NextUI
    {
      raw: `
        bg-primary bg-secondary bg-highlight bg-dark-background bg-background
        text-primary text-secondary text-highlight text-dark text-white text-gray
        hover:text-primary hover:text-secondary hover:text-highlight hover:text-dark hover:text-white hover:text-gray
        from-primary to-secondary
        bg-primary-darker hover:bg-primary-darker
        focus:ring-primary focus:ring-primary/20 focus:border-primary border-primary shadow-primary/40
      `,
    },
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