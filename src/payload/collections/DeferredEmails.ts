import { CollectionConfig } from 'payload';
import { hideIfNotAdmin } from './helpers';

export const DeferredEmails: CollectionConfig = {
  slug: 'deferred-emails',
  admin: {hidden:hideIfNotAdmin,
    useAsTitle: 'category',
    defaultColumns: ['category', 'status', 'scheduledFor', 'attempts'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'emailData',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Serialized email data to be sent later',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Notifications', value: 'notifications' },
        { label: 'Alerts', value: 'alerts' },
        { label: 'Validators', value: 'validators' },
        { label: 'Authenticators', value: 'authenticators' },
        { label: 'Misc', value: 'misc' },
      ],
    },
    {
      name: 'scheduledFor',
      type: 'date',
      required: true,
      admin: {
        description: 'When this email should be sent',
      },
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        condition: (data) => data.status === 'sent',
      },
    },
    {
      name: 'lastError',
      type: 'textarea',
      admin: {
        condition: (data) => data.status === 'failed',
      },
    },
  ],
};
