import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import Link from 'next/link'

import config from '@/payload.config'
import './styles.css'
import { TemplatePreviewForm } from '../components/TemplatePreviewForm'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Fetch templates
  const templates = await payload.find({
    collection: 'templates',
    depth: 2
  })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="min-h-screen bg-gray-50 temp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center">
          <picture className="inline-block mb-8">
            <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
            <Image
              alt="Payload Logo"
              height={65}
              src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
              width={65}
            />
          </picture>
          {user && <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user.email}</h1>}
        </div>

        {/* Templates Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Available Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.docs.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {template.thumbnail && typeof template.thumbnail === 'object' && template.thumbnail.url && (
                    <Image
                      src={template.thumbnail.url}
                      alt={template.name}
                      width={200}
                      height={200}
                    />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    {template.category && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {template.category}
                      </span>
                    )}
                  </div>
                  <Link 
                    href={template.templateFiles?.[0]?.path || '#'}
                    className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
                  >
                    View Template
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <a
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-300"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="px-6 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors duration-300"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  )
}
