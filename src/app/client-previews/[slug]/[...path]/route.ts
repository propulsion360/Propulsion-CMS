import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)
const access = promisify(fs.access)

export async function GET(
  request: Request,
  { params }: { params: { slug: string; path: string[] } },
) {
  try {
    const { slug, path: filePath } = params
    const clientDir = path.join(process.cwd(), 'public', 'client-previews', slug)

    console.log('Client preview directory:', clientDir)
    console.log('Requested path:', filePath)

    // If no specific file is requested, try to serve index.html
    const requestedFile = filePath.length > 0 ? filePath.join('/') : 'index.html'
    const filePathToServe = path.join(clientDir, requestedFile)

    console.log('Attempting to serve file:', filePathToServe)

    // Check if the file exists
    try {
      await access(filePathToServe, fs.constants.F_OK)
    } catch (error) {
      console.error('File not found:', filePathToServe)

      // List files in the client directory to help debug
      try {
        const files = await readdir(clientDir, { withFileTypes: true })
        console.log(
          'Files in client directory:',
          files.map((f) => ({
            name: f.name,
            isDirectory: f.isDirectory(),
          })),
        )
      } catch (error) {
        console.error('Error listing client directory:', error)
      }

      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    try {
      const content = await readFile(filePathToServe)

      // Determine content type based on file extension
      const ext = path.extname(filePathToServe).toLowerCase()
      const contentType =
        {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.jsx': 'application/javascript',
          '.ts': 'application/javascript',
          '.tsx': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
        }[ext] || 'application/octet-stream'

      console.log('Serving file with content type:', contentType)
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
        },
      })
    } catch (error) {
      console.error('Error reading file:', error)
      return NextResponse.json({ error: 'Error reading file' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error serving client preview:', error)
    return NextResponse.json({ error: 'Failed to serve client preview' }, { status: 500 })
  }
}
