import { NextResponse } from 'next/server';
import payload from 'payload';
import { TemplateService } from '../../../services/templateService';

export async function POST(request: Request) {
  try {
    const { clientName, previewId, customDomain } = await request.json();

    if (!clientName || !previewId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const templateService = new TemplateService();

    // 1. Deploy to GitHub
    const githubUrl = await templateService.deployToGitHub({
      clientName,
      previewId,
    });

    // Update preview record with GitHub URL
    await payload.update({
      collection: 'client-previews',
      id: previewId,
      data: {
        githubRepo: githubUrl,
        deploymentStatus: 'deploying',
      },
    });

    // 2. Deploy to Vercel
    const vercelUrl = await templateService.deployToVercel({
      clientName,
      previewId,
      customDomain,
    });

    // Update preview record with deployment status
    await payload.update({
      collection: 'client-previews',
      id: previewId,
      data: {
        vercelDeploymentUrl: vercelUrl,
        deploymentStatus: 'deployed',
        customDomain: customDomain || null,
      },
    });

    return NextResponse.json({
      success: true,
      githubUrl,
      vercelUrl,
      customDomain,
    });
  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy site' },
      { status: 500 }
    );
  }
} 