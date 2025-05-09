import { Octokit } from '@octokit/rest';
import { createClient } from '@vercel/client';
import fs from 'fs/promises';
import path from 'path';
import payload from 'payload';
import { Template, ClientPreview } from '../payload-types';

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
  private vercel: ReturnType<typeof createClient>;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.vercel = createClient({
      token: process.env.VERCEL_TOKEN,
    });
  }

  async generatePreview(options: TemplatePreviewOptions): Promise<string> {
    const { clientName, templateId, customizations } = options;
    
    // 1. Get template data from Payload
    const template = await payload.findByID<Template>({
      collection: 'templates',
      id: templateId,
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // 2. Create preview directory
    const previewDir = path.join(process.cwd(), 'previews', clientName);
    await fs.mkdir(previewDir, { recursive: true });

    // 3. Copy and customize template files
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

    return previewDir;
  }

  async deployToGitHub(options: DeploymentOptions): Promise<string> {
    const { clientName, previewId } = options;
    
    // 1. Get preview data
    const preview = await payload.findByID<ClientPreview>({
      collection: 'client-previews',
      id: previewId,
    });

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
    const preview = await payload.findByID<ClientPreview>({
      collection: 'client-previews',
      id: previewId,
    });

    if (!preview?.githubRepo) {
      throw new Error('GitHub repository not found');
    }

    // 2. Deploy to Vercel
    const deployment = await this.vercel.deployments.create({
      name: `client-${clientName}`,
      gitSource: {
        type: 'github',
        repo: preview.githubRepo,
      },
    });

    // 3. Configure custom domain if provided
    if (customDomain) {
      await this.vercel.domains.create({
        name: customDomain,
        projectId: deployment.id,
      });
    }

    return deployment.url;
  }
} 