import type { CollectionConfig } from 'payload'
import path from 'path'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(__dirname, '../../media'),
    mimeTypes: ['image/*', 'application/zip'],
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
