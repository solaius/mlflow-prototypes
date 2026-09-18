import type { Data } from '@puckeditor/core';

export const detailPageTemplate: { name: string; description: string; data: Data } = {
  name: 'Detail Page',
  description: 'Breadcrumb navigation, header with status tag and action buttons, tabbed content area.',
  data: {
    root: { props: {} },
    content: [
      {
        type: 'DuBoisHeader',
        props: {
          id: 'header',
          title: 'Item Name',
          breadcrumbs: [
            {
              type: 'DuBoisBreadcrumb',
              props: {
                id: 'breadcrumb',
                items: [{ label: 'Home' }, { label: 'Items' }, { label: 'Item Detail' }],
                includeTrailingCaret: true,
              },
            },
          ],
          titleAddOns: [
            { type: 'DuBoisTag', props: { id: 'status-tag', label: 'Active', color: 'lime', closable: false } },
          ],
          buttons: [
            {
              type: 'DuBoisButton',
              props: {
                id: 'btn-edit',
                label: 'Edit',
                icon: 'pencil',
                type: '',
                size: 'middle',
                danger: false,
                disabled: false,
              },
            },
            {
              type: 'DuBoisDropdownMenu',
              props: {
                id: 'more-actions',
                triggerLabel: 'More',
                items: [
                  { label: 'Duplicate', danger: false },
                  { label: 'Archive', danger: false },
                  { label: 'Delete', danger: true },
                ],
              },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-1', size: 'sm' } },
      {
        type: 'DuBoisTabs',
        props: {
          id: 'detail-tabs',
          defaultValue: 'overview',
          tabs: [
            { label: 'Overview', value: 'overview' },
            { label: 'Configuration', value: 'config' },
            { label: 'History', value: 'history' },
          ],
        },
      },
    ],
  },
};
