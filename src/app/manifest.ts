import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OpsFlow IT Inventory',
    short_name: 'OpsFlow IT',
    description: 'Sistem manajemen inventaris IT, purchase order, maintenance, dan service terintegrasi.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    lang: 'id',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Purchase Order',
        short_name: 'PO',
        description: 'Buat Purchase Order baru',
        url: '/po/new',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Tambah Barang',
        short_name: 'Inventaris',
        description: 'Tambah item inventaris baru',
        url: '/items/new',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Catat Service',
        short_name: 'Service',
        description: 'Catat service perangkat',
        url: '/services/new',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  };
}
