import { CollectionConfig } from 'payload'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
const readdir = promisify(fs.readdir)

interface TemplateFile {
  path: string
  content: string
}

interface Template {
  templateFiles: TemplateFile[]
}

export const ClientPreviews: CollectionConfig = {
  slug: 'client-previews',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'customizations.businessName', 'buildStatus'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'templates',
      required: true,
    },
    {
      name: 'customizations',
      type: 'group',
      fields: [
        {
          name: 'businessName',
          type: 'text',
          required: true,
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'URL to preview the client template',
      },
    },
    {
      name: 'buildStatus',
      type: 'select',
      options: [
        { label: 'Not Built', value: 'not-built' },
        { label: 'Building', value: 'building' },
        { label: 'Built', value: 'built' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'not-built',
      required: true,
    },
    {
      name: 'deploymentStatus',
      type: 'select',
      options: [
        { label: 'Not Deployed', value: 'not-deployed' },
        { label: 'Deploying', value: 'deploying' },
        { label: 'Deployed', value: 'deployed' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'not-deployed',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data.template) {
          try {
            console.log('Starting client preview creation for template:', data.template)

            // Get the original template
            const template = (await req.payload.findByID({
              collection: 'templates',
              id: data.template,
            })) as Template

            if (!template || !template.templateFiles) {
              throw new Error('Template not found or has no files')
            }

            console.log('Found template with files:', template.templateFiles.length)

            // Create a unique directory for this client preview
            const clientDir = path.join(
              process.cwd(),
              'public',
              'client-previews',
              data.clientName.toLowerCase().replace(/\s+/g, '-'),
            )

            console.log('Creating client directory:', clientDir)
            await mkdir(clientDir, { recursive: true })

            // Copy and customize template files
            const customizedFiles = []
            for (const file of template.templateFiles) {
              let content = file.content

              if (typeof content !== 'string') {
                console.error(
                  `File content for ${file.path} is not a string or is undefined. Skipping.`,
                )
                continue
              }

              // Replace logo if it's an HTML file
              if (file.path.endsWith('.html')) {
                // Get the logo URL if provided
                if (data.customizations?.logo) {
                  const logo = await req.payload.findByID({
                    collection: 'media',
                    id: data.customizations.logo,
                  })

                  if (logo) {
                    // Replace logo in HTML content
                    content = content.replace(
                      /<img[^>]*class="[^"]*logo[^"]*"[^>]*>/i,
                      `<img src="/media/${logo.filename}" alt="${data.customizations.businessName} Logo" class="logo">`,
                    )
                  }
                }

                // Replace business name
                content = content.replace(
                  /<title>.*?<\/title>/i,
                  `<title>${data.customizations.businessName}</title>`,
                )
              }

              // Write the customized file
              const filePath = path.join(clientDir, file.path)
              console.log('Writing file:', filePath)
              await mkdir(path.dirname(filePath), { recursive: true })
              await writeFile(filePath, content)

              customizedFiles.push({
                path: file.path,
                content,
              })
            }

            // Verify files were created
            const files = await readdir(clientDir, { recursive: true })
            console.log('Files created in client directory:', files)

            // Set the preview URL
            data.previewUrl = `/client-previews/${data.clientName.toLowerCase().replace(/\s+/g, '-')}/index.html`
            console.log('Set preview URL:', data.previewUrl)

            // Update build status
            data.buildStatus = 'built'

            return data
          } catch (error: unknown) {
            console.error('Error creating client preview:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            throw new Error('Failed to create client preview: ' + errorMessage)
          }
        }
        return data
      },
    ],
  },
}

export default ClientPreviews
