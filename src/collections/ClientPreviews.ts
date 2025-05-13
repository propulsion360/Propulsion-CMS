import { CollectionConfig } from 'payload';

const ClientPreviews: CollectionConfig = {
  slug: 'client-previews',
  admin: {
    useAsTitle: 'clientName',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'templates',
      required: true,
    },
    {
      name: 'customizations',
      type: 'json',
      defaultValue: {},
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'buildStatus',
      type: 'select',
      options: [
        {
          label: 'Not Built',
          value: 'not-built',
        },
        {
          label: 'Building',
          value: 'building',
        },
        {
          label: 'Built',
          value: 'built',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
      defaultValue: 'not-built',
      required: true,
    },
    {
      name: 'deploymentStatus',
      type: 'select',
      options: [
        {
          label: 'Not Deployed',
          value: 'not-deployed',
        },
        {
          label: 'Deploying',
          value: 'deploying',
        },
        {
          label: 'Deployed',
          value: 'deployed',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
      defaultValue: 'not-deployed',
      required: true,
    },
    {
      name: 'githubRepo',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'vercelDeploymentUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customDomain',
      type: 'text',
    },
  ],
};

export default ClientPreviews; 