// src/collections/Templates.ts
import { CollectionConfig } from 'payload'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import extract from 'extract-zip'
import { v4 as uuidv4 } from 'uuid'
import AdmZip from 'adm-zip'
import CreateClientTemplate from '../components/CreateClientTemplate'

const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)
const copyFile = promisify(fs.copyFile)

interface Dependency {
  name: string
  version: string
}

interface PreviewMapping {
  templateId: string
  templateDir: string
  type: 'html' | 'react'
  dependencies?: {
    [key: string]: string
  }
}

interface PreviewMappings {
  [key: string]: PreviewMapping
}

interface TemplateAction {
  label: string
  handler: (args: { req: any; id: string }) => Promise<{
    success: boolean
    message: string
    redirect?: string
  }>
}

const Templates: CollectionConfig = {
  slug: 'templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'templateType', 'createdAt'],
    group: 'Content',
    components: {
      afterList: [CreateClientTemplate],
    },
  },
  access: {
    read: () => true,
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
      name: 'templateFile',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: {
        mimeType: {
          equals: 'application/zip',
        },
      },
    },
    {
      name: 'templateType',
      type: 'select',
      required: true,
      options: [
        { label: 'HTML', value: 'html' },
        { label: 'React', value: 'react' },
      ],
      defaultValue: 'html',
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'templateFiles',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'path',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'dependencies',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'version',
          type: 'text',
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
      async ({ data, req }) => {
        if (!data.templateFile) return data

        try {
          const media = await req.payload.findByID({
            collection: 'media',
            id: data.templateFile,
          })

          if (!media || !media.filename) {
            throw new Error('Template file not found or invalid')
          }

          const zipPath = path.join(process.cwd(), 'media', media.filename)
          const zip = new AdmZip(zipPath)
          const zipEntries = zip.getEntries()

          // Create a unique directory for this template
          const templateDir = path.join(
            process.cwd(),
            'public',
            'templates',
            data.name.toLowerCase().replace(/\s+/g, '-'),
          )
          await mkdir(templateDir, { recursive: true })

          const templateFiles = []
          let mainFile = 'index.html'
          let dependencies: Dependency[] = []

          // First pass: Extract all files
          for (const entry of zipEntries) {
            if (!entry.isDirectory) {
              const filePath = path.join(templateDir, entry.entryName)
              await mkdir(path.dirname(filePath), { recursive: true })
              await writeFile(filePath, entry.getData())

              templateFiles.push({
                path: entry.entryName,
                content: entry.getData().toString('utf8'),
              })

              // For React templates, look for entry points
              if (data.templateType === 'react') {
                const entryPoints = [
                  'index.js',
                  'index.jsx',
                  'index.ts',
                  'index.tsx',
                  'App.js',
                  'App.jsx',
                  'App.ts',
                  'App.tsx',
                ]
                if (entryPoints.includes(path.basename(entry.entryName))) {
                  mainFile = entry.entryName
                }
              }

              // Check for package.json to get dependencies
              if (entry.entryName === 'package.json') {
                try {
                  const packageJson = JSON.parse(entry.getData().toString('utf8'))
                  if (packageJson.dependencies) {
                    dependencies = Object.entries(packageJson.dependencies).map(
                      ([name, version]) => ({
                        name,
                        version: version as string,
                      }),
                    )
                  }
                } catch (error) {
                  console.error('Error parsing package.json:', error)
                }
              }
            }
          }

          // Generate preview URL
          const previewUrl = `/templates/${data.name.toLowerCase().replace(/\s+/g, '-')}/${mainFile}`

          return {
            ...data,
            previewUrl,
            templateFiles,
            dependencies,
          }
        } catch (error) {
          console.error('Error processing template:', error)
          throw error
        }
      },
    ],
  },
}

// Helper function to recursively read directory
async function readDirRecursive(dir: string): Promise<string[]> {
  const files = await promisify(fs.readdir)(dir)
  const filePaths = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file)
      const stat = await promisify(fs.stat)(filePath)
      if (stat.isDirectory()) {
        return readDirRecursive(filePath)
      }
      return filePath
    }),
  )
  return filePaths.flat()
}

export default Templates
