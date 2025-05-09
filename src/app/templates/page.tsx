import React from 'react';
import payload from 'payload';
import type { Template } from '@payload-types';
import { TemplatePreviewForm } from '../components/TemplatePreviewForm';

async function getTemplates() {
  try {
    const response = await payload.find({
      collection: 'templates',
      where: {
        status: {
          equals: 'published',
        },
      },
    });

    return response.docs as Template[];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Website Templates</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div
            key={template.id}
            className="border rounded-lg overflow-hidden shadow-lg"
          >
            {template.thumbnail && (
              <img
                src={typeof template.thumbnail === 'string' ? template.thumbnail : template.thumbnail?.url || ''}
                alt={template.name}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{template.name}</h2>
              <p className="text-gray-600 mb-4">{template.description || ''}</p>
              
              <div className="mt-4">
                <TemplatePreviewForm templateId={template.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 