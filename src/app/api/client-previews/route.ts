import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { fileURLToPath } from 'url'
import path from 'path'
import { Users } from '../../../collections/Users'
import { Media } from '../../../collections/Media'
import Templates from '../../../collections/Templates'
import ClientPreviews from '../../../collections/ClientPreviews'
import getPayloadClient from '../../../getPayloadClient'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const config = buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Templates, ClientPreviews, Users, Media],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
})

export async function POST(request: Request) {
  try {
    console.log('Received request to create client preview')
    const payload = await getPayload({
      config: configPromise,
    })
    const data = await request.json()
    console.log('Request data:', data)

    if (!data.template) {
      throw new Error('Template ID is required')
    }

    // Get the template first to ensure it exists
    const template = await payload.findByID({
      collection: 'templates',
      id: data.template,
    })

    if (!template) {
      throw new Error('Template not found')
    }

    console.log('Creating client preview for template:', template.id)

    const clientPreview = await payload.create({
      collection: 'client-previews',
      data: {
        template: data.template,
        clientName: 'New Client',
        customizations: {
          businessName: 'New Business',
          logo: null,
        },
        buildStatus: 'not-built',
        deploymentStatus: 'not-deployed',
      },
    })

    console.log('Created client preview:', clientPreview)

    return NextResponse.json({
      success: true,
      doc: clientPreview,
    })
  } catch (error) {
    console.error('Error creating client preview:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create client preview',
      },
      { status: 500 },
    )
  }
}
