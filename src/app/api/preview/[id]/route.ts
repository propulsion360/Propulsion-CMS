import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)

interface PreviewMapping {
  templateId: string
  templateDir: string
}

interface PreviewMappings {
  [key: string]: PreviewMapping
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const previewId = params.id
    console.log('Preview request for ID:', previewId)

    const previewMappingPath = path.join(process.cwd(), 'preview-mappings.json')
    console.log('Reading preview mappings from:', previewMappingPath)

    // Read the preview mappings
    const mappingContent = await readFile(previewMappingPath, 'utf-8')
    const previewMappings: PreviewMappings = JSON.parse(mappingContent)
    console.log('Available preview mappings:', Object.keys(previewMappings))

    // Get the template directory for this preview
    const mapping = previewMappings[previewId]
    if (!mapping) {
      console.log('Preview mapping not found for ID:', previewId)
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 })
    }

    console.log('Found template directory:', mapping.templateDir)

    // Read the index.html file from the template directory
    const indexPath = path.join(mapping.templateDir, 'index.html')
    console.log('Trying to read index.html from:', indexPath)

    try {
      const content = await readFile(indexPath, 'utf-8')
      console.log('Successfully read index.html')
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    } catch (error) {
      console.log('index.html not found, searching for other HTML files')
      // If index.html doesn't exist, try to find any HTML file
      const files = await readdir(mapping.templateDir)
      console.log('Files in template directory:', files)

      const htmlFile = files.find((file) => file.endsWith('.html'))
      console.log('Found HTML file:', htmlFile)

      if (!htmlFile) {
        console.log('No HTML files found in template directory')
        return NextResponse.json({ error: 'No HTML files found in template' }, { status: 404 })
      }

      const content = await readFile(path.join(mapping.templateDir, htmlFile), 'utf-8')
      console.log('Successfully read HTML file:', htmlFile)
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }
  } catch (error) {
    console.error('Error serving preview:', error)
    return NextResponse.json({ error: 'Failed to serve preview' }, { status: 500 })
  }
}
