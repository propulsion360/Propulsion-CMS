import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';
import payload from 'payload';
import type { Template, ClientPreview } from '../payload-types';

interface TemplatePreviewOptions {
  clientName: string;
  templateId: string;
  customizations: Record<string, any>;
}

interface DeploymentOptions {
  clientName: string;
  previewId: string;
  customDomain?: string;
}

export class TemplateService {
  private octokit: Octokit;
  private vercelToken: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.vercelToken = process.env.VERCEL_TOKEN || '';
  }

  async generatePreview(options: TemplatePreviewOptions): Promise<string> {
    const { clientName, templateId, customizations } = options;
    
    // 1. Get template data from Payload
    const template = await payload.findByID({
      collection: 'templates',
      id: templateId,
    }) as Template;

    if (!template) {
      throw new Error('Template not found');
    }

    // 2. Create preview directory
    const previewDir = path.join(process.cwd(), 'previews', clientName);
    await fs.mkdir(previewDir, { recursive: true });

    // 3. Copy and customize template files
    if (template.templateFiles) {
      for (const file of template.templateFiles) {
        const filePath = path.join(previewDir, file.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Apply customizations to the file content
        let content = file.content;
        for (const [key, value] of Object.entries(customizations)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
        }
        
        await fs.writeFile(filePath, content);
      }
    }

    return previewDir;
  }

  async deployToGitHub(options: DeploymentOptions): Promise<string> {
    const { clientName, previewId } = options;
    
    // 1. Get preview data
    const preview = await payload.findByID({
      collection: 'client-previews',
      id: previewId,
    }) as ClientPreview;

    if (!preview) {
      throw new Error('Preview not found');
    }

    // 2. Create GitHub repository
    const repoName = `client-${clientName}`;
    const repo = await this.octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
      auto_init: true,
    });

    // 3. Push preview files to GitHub
    const previewDir = path.join(process.cwd(), 'previews', clientName);
    // Implementation of git push logic here...

    return repo.data.html_url;
  }

  async deployToVercel(options: DeploymentOptions): Promise<string> {
    const { clientName, previewId, customDomain } = options;

    // 1. Get GitHub repo URL
    const preview = await payload.findByID({
      collection: 'client-previews',
      id: previewId,
    }) as ClientPreview;

    if (!preview?.githubRepo) {
      throw new Error('GitHub repository not found');
    }

    // 2. Deploy to Vercel using REST API
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `client-${clientName}`,
        gitSource: {
          type: 'github',
          repo: preview.githubRepo,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to deploy to Vercel');
    }

    const deployment = await response.json();

    // 3. Configure custom domain if provided
    if (customDomain) {
      await fetch('https://api.vercel.com/v9/domains', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customDomain,
          project: deployment.id,
        }),
      });
    }

    return deployment.url;
  }
} 