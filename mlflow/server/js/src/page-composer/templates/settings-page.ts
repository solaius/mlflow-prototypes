import type { Data } from '@puckeditor/core';

export const settingsPageTemplate: { name: string; description: string; data: Data } = {
  name: 'Settings Page',
  description: 'Section headers with cards containing setting rows — toggles, checkboxes, and a danger zone.',
  data: {
    root: { props: {} },
    content: [
      {
        type: 'DuBoisTypography',
        props: { id: 'section-general-title', text: 'General', variant: 'title', level: 3, bold: false },
      },
      {
        type: 'DuBoisTypography',
        props: {
          id: 'section-general-desc',
          text: 'Manage your workspace preferences',
          variant: 'text',
          level: 2,
          bold: false,
          color: 'secondary',
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-1', size: 'sm' } },
      {
        type: 'DuBoisCard',
        props: {
          id: 'general-card',
          width: '100%',
          padding: 'default',
          disableHover: true,
          content: [
            {
              type: 'FlexRow',
              props: {
                id: 'setting-1',
                gap: 'md',
                justifyContent: 'space-between',
                alignItems: 'center',
                content: [
                  {
                    type: 'FlexColumn',
                    props: {
                      id: 'setting-1-text',
                      gap: 'xs',
                      content: [
                        {
                          type: 'DuBoisTypography',
                          props: { id: 'setting-1-title', text: 'Dark Mode', variant: 'title', level: 4, bold: false },
                        },
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'setting-1-desc',
                            text: 'Switch between light and dark themes',
                            variant: 'text',
                            level: 2,
                            bold: false,
                            color: 'secondary',
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'DuBoisSwitch',
                    props: { id: 'switch-dark', label: 'Dark', checked: false, disabled: false },
                  },
                ],
              },
            },
            { type: 'DuBoisSpacer', props: { id: 'divider-1', size: 'sm' } },
            {
              type: 'FlexRow',
              props: {
                id: 'setting-2',
                gap: 'md',
                justifyContent: 'space-between',
                alignItems: 'center',
                content: [
                  {
                    type: 'FlexColumn',
                    props: {
                      id: 'setting-2-text',
                      gap: 'xs',
                      content: [
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'setting-2-title',
                            text: 'Email Notifications',
                            variant: 'title',
                            level: 4,
                            bold: false,
                          },
                        },
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'setting-2-desc',
                            text: 'Receive email alerts for failed runs',
                            variant: 'text',
                            level: 2,
                            bold: false,
                            color: 'secondary',
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'DuBoisSwitch',
                    props: { id: 'switch-notifications', label: 'On', checked: true, disabled: false },
                  },
                ],
              },
            },
            { type: 'DuBoisSpacer', props: { id: 'divider-2', size: 'sm' } },
            {
              type: 'FlexRow',
              props: {
                id: 'setting-3',
                gap: 'md',
                justifyContent: 'space-between',
                alignItems: 'center',
                content: [
                  {
                    type: 'FlexColumn',
                    props: {
                      id: 'setting-3-text',
                      gap: 'xs',
                      content: [
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'setting-3-title',
                            text: 'Auto-save experiments',
                            variant: 'title',
                            level: 4,
                            bold: false,
                          },
                        },
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'setting-3-desc',
                            text: 'Automatically save experiment state on navigation',
                            variant: 'text',
                            level: 2,
                            bold: false,
                            color: 'secondary',
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'DuBoisCheckbox',
                    props: { id: 'check-autosave', label: 'Enabled', isChecked: true, disabled: false },
                  },
                ],
              },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-3', size: 'lg' } },
      {
        type: 'DuBoisTypography',
        props: {
          id: 'section-danger-title',
          text: 'Danger Zone',
          variant: 'title',
          level: 3,
          bold: false,
          color: 'error',
        },
      },
      {
        type: 'DuBoisTypography',
        props: {
          id: 'section-danger-desc',
          text: 'Irreversible and destructive actions',
          variant: 'text',
          level: 2,
          bold: false,
          color: 'secondary',
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-4', size: 'sm' } },
      {
        type: 'DuBoisCard',
        props: {
          id: 'danger-card',
          width: '100%',
          padding: 'default',
          disableHover: true,
          content: [
            {
              type: 'FlexRow',
              props: {
                id: 'danger-row',
                gap: 'md',
                justifyContent: 'space-between',
                alignItems: 'center',
                content: [
                  {
                    type: 'FlexColumn',
                    props: {
                      id: 'danger-text',
                      gap: 'xs',
                      content: [
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'danger-title',
                            text: 'Delete Workspace',
                            variant: 'title',
                            level: 4,
                            bold: false,
                          },
                        },
                        {
                          type: 'DuBoisTypography',
                          props: {
                            id: 'danger-desc',
                            text: 'Permanently delete this workspace and all its data. This action cannot be undone.',
                            variant: 'text',
                            level: 2,
                            bold: false,
                            color: 'secondary',
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'DuBoisButton',
                    props: {
                      id: 'btn-delete',
                      label: 'Delete',
                      icon: 'trash',
                      type: 'primary',
                      size: 'middle',
                      danger: true,
                      disabled: false,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};
