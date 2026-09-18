import type { Data } from '@puckeditor/core';

export const listPageTemplate: { name: string; description: string; data: Data } = {
  name: 'List Page',
  description: 'Header with search/filter bar, data table, and pagination — the standard MLflow list pattern.',
  data: {
    root: { props: {} },
    content: [
      {
        type: 'DuBoisHeader',
        props: {
          id: 'header',
          title: 'Items',
          buttons: [
            {
              type: 'DuBoisButton',
              props: {
                id: 'btn-create',
                label: 'Create New',
                icon: 'plus',
                type: 'primary',
                size: 'middle',
                danger: false,
                disabled: false,
              },
            },
          ],
          breadcrumbs: [],
          titleAddOns: [],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-1', size: 'md' } },
      {
        type: 'FlexRow',
        props: {
          id: 'filter-bar',
          gap: 'sm',
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
          content: [
            {
              type: 'DuBoisInput',
              props: { id: 'search', placeholder: 'Search items...', label: 'Search', disabled: false },
            },
            {
              type: 'DuBoisSimpleSelect',
              props: {
                id: 'filter-status',
                label: 'Status',
                placeholder: 'All',
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Archived', value: 'archived' },
                ],
              },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-2', size: 'md' } },
      {
        type: 'DuBoisTable',
        props: {
          id: 'main-table',
          columns: [{ header: 'Name' }, { header: 'Status' }, { header: 'Created' }, { header: 'Actions' }],
          rows: 5,
          size: 'default',
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-3', size: 'sm' } },
      {
        type: 'DuBoisPagination',
        props: { id: 'pagination', hasNextPage: true, hasPreviousPage: false },
      },
    ],
  },
};
