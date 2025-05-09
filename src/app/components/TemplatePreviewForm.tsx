'use client';

import React, { useState } from 'react';
import { TemplatePreview } from './TemplatePreview';

interface TemplatePreviewFormProps {
  templateId: string;
}

export const TemplatePreviewForm: React.FC<TemplatePreviewFormProps> = ({
  templateId,
}) => {
  const [clientName, setClientName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  return (
    <div>
      {!showPreview ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="clientName"
              className="block text-sm font-medium text-gray-700"
            >
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens are allowed"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be used for the preview URL and repository name
            </p>
          </div>
          <button
            type="submit"
            disabled={!clientName}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Continue to Preview
          </button>
        </form>
      ) : (
        <TemplatePreview templateId={templateId} clientName={clientName} />
      )}
    </div>
  );
}; 