'use client'

import React from 'react'
import { Button } from '@payloadcms/ui'
import { useDocumentInfo } from '@payloadcms/ui'

const CreateClientTemplate = () => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { id } = useDocumentInfo()

  const handleCreate = async () => {
    if (!id) {
      setError('No template ID found')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Creating client preview for template:', id)

      const response = await fetch('/api/client-previews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: id,
        }),
      })

      const data = await response.json()
      console.log('Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client preview')
      }

      if (data.success) {
        window.location.href = `/admin/collections/client-previews/${data.doc.id}`
      } else {
        throw new Error(data.error || 'Failed to create client preview')
      }
    } catch (error) {
      console.error('Error creating client preview:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create Client Template'}
      </Button>
      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}
    </div>
  )
}

export default CreateClientTemplate
