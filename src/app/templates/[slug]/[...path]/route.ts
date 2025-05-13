import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)

export async function GET(
  request: Request,
  { params }: { params: { slug: string; path: string[] } },
) {
  try {
    const { slug, path: filePath } = params
    const templateDir = path.join(process.cwd(), 'public', 'templates', slug)

    console.log('Template directory:', templateDir)
    console.log('Requested path:', filePath)

    // If no specific file is requested, try to serve index.html
    const requestedFile = filePath.length > 0 ? filePath.join('/') : 'index.html'
    const filePathToServe = path.join(templateDir, requestedFile)

    console.log('Attempting to serve file:', filePathToServe)

    // Check if the file exists
    try {
      await promisify(fs.access)(filePathToServe, fs.constants.F_OK)
    } catch (error) {
      console.error('File not found:', filePathToServe)

      // List files in the template directory to help debug
      try {
        const files = await readdir(templateDir, { withFileTypes: true })
        console.log(
          'Files in template directory:',
          files.map((f) => ({
            name: f.name,
            isDirectory: f.isDirectory(),
          })),
        )
      } catch (error) {
        console.error('Error listing template directory:', error)
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

      // For React components, wrap them in a basic HTML structure
      if (['.jsx', '.tsx', '.js', '.ts'].includes(ext)) {
        const reactContent = content.toString()
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Template Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${reactContent}
    
    // Render the component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
          },
        })
      }

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
    console.error('Error serving template:', error)
    return NextResponse.json({ error: 'Failed to serve template' }, { status: 500 })
  }
}
