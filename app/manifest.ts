import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Friday - Focus on What Matters Most',
    short_name: 'Friday',
    description: 'Prioritize your daily tasks using proven productivity principles. Achieve more with less stress.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FDE047',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
