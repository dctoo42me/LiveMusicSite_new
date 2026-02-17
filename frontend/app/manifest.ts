import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Forks & Feedback',
    short_name: 'ForksFeedback',
    description: 'Discover the intersection of great food and live entertainment.',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#9c27b0',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
