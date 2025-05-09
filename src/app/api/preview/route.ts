import { NextResponse } from 'next/server';
import payload from 'payload';
import { TemplateService } from '../../../services/templateService';

export async function POST(request: Request) {
  try {
    const { clientName, templateId, customizations } = await request.json();

    if (!clientName || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const templateService = new TemplateService();
    const previewPath = await templateService.generatePreview({
      clientName,
      templateId,
      customizations: customizations || {},
    });

    // Create a preview record in Payload
    const preview = await payload.create({
      collection: 'client-previews',
      data: {
        clientName,
        template: templateId,
        customizations,
        buildStatus: 'built',
        deploymentStatus: 'not-deployed',
      },
    });

    return NextResponse.json({
      success: true,
      previewPath,
      previewId: preview.id,
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
} 