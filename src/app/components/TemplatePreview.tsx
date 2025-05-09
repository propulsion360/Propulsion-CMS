import React, { useState } from 'react';

interface TemplatePreviewProps {
  templateId: string;
  clientName: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateId,
  clientName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState('');

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          templateId,
          customizations: {}, // Add customization fields as needed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setPreviewId(data.previewId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const deploySite = async () => {
    if (!previewId) return;

    try {
      setIsDeploying(true);
      setError(null);

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          previewId,
          customDomain: customDomain || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy site');
      }

      // Handle successful deployment
      window.open(data.vercelUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={generatePreview}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Preview'}
        </button>

        {previewId && (
          <>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="Custom domain (optional)"
              className="px-4 py-2 border rounded"
            />
            <button
              onClick={deploySite}
              disabled={isDeploying}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isDeploying ? 'Deploying...' : 'Deploy Site'}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}; 