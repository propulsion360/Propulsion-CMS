// src/collections/Templates.ts
import { CollectionConfig } from 'payload/types'

const Templates: CollectionConfig = {
  slug: 'templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive'],
  },
  access: {
    read: () => true, // Anyone can view templates
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'This will be used for the template directory name',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'templateFiles',
      type: 'array',
      fields: [
        {
          name: 'path',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'code',
          required: true,
        },
      ],
    },
    {
      name: 'metadata',
      type: 'json',
      defaultValue: {},
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Only active templates will be shown to clients',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Business', value: 'business' },
        { label: 'E-commerce', value: 'ecommerce' },
        { label: 'Blog', value: 'blog' },
        { label: 'Portfolio', value: 'portfolio' },
        { label: 'Landing Page', value: 'landing' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Make sure slug is set from name if not provided
        if (!data.slug && data.name) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return data
      },
    ],
  },
}

export default Templates
