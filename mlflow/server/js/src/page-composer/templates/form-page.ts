import type { Data } from '@puckeditor/core';

export const formPageTemplate: { name: string; description: string; data: Data } = {
  name: 'Form / Create Page',
  description: 'Breadcrumb, title, labeled form fields with inputs and selects, and submit/cancel buttons.',
  data: {
    root: { props: {} },
    content: [
      {
        type: 'DuBoisBreadcrumb',
        props: {
          id: 'breadcrumb',
          items: [{ label: 'Home' }, { label: 'Items' }, { label: 'Create New' }],
          includeTrailingCaret: true,
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-1', size: 'sm' } },
      {
        type: 'DuBoisTypography',
        props: { id: 'page-title', text: 'Create New Item', variant: 'title', level: 2, bold: false },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-2', size: 'sm' } },
      { type: 'Divider', props: { id: 'separator' } },
      { type: 'DuBoisSpacer', props: { id: 'spacer-2b', size: 'md' } },
      {
        type: 'DuBoisFormField',
        props: {
          id: 'field-name',
          label: 'Name',
          hint: 'Enter a unique name for this item',
          input: [
            {
              type: 'DuBoisInput',
              props: { id: 'input-name', placeholder: 'My experiment', label: '', disabled: false },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-3', size: 'md' } },
      {
        type: 'DuBoisFormField',
        props: {
          id: 'field-category',
          label: 'Category',
          hint: '',
          input: [
            {
              type: 'DuBoisSimpleSelect',
              props: {
                id: 'select-category',
                label: '',
                placeholder: 'Select a category',
                options: [
                  { label: 'Machine Learning', value: 'ml' },
                  { label: 'Deep Learning', value: 'dl' },
                  { label: 'NLP', value: 'nlp' },
                  { label: 'Computer Vision', value: 'cv' },
                ],
              },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-4', size: 'md' } },
      {
        type: 'DuBoisFormField',
        props: {
          id: 'field-description',
          label: 'Description',
          hint: 'Optional. Describe the purpose of this item.',
          input: [
            {
              type: 'DuBoisInput',
              props: { id: 'input-desc', placeholder: 'A brief description...', label: '', disabled: false },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-5', size: 'md' } },
      {
        type: 'FlexRow',
        props: {
          id: 'setting-notify',
          gap: 'sm',
          justifyContent: 'flex-start',
          alignItems: 'center',
          content: [
            {
              type: 'DuBoisCheckbox',
              props: {
                id: 'check-notify',
                label: 'Send notification when runs complete',
                isChecked: true,
                disabled: false,
              },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-6', size: 'lg' } },
      {
        type: 'FlexRow',
        props: {
          id: 'action-buttons',
          gap: 'sm',
          justifyContent: 'flex-end',
          alignItems: 'center',
          content: [
            {
              type: 'DuBoisButton',
              props: {
                id: 'btn-cancel',
                label: 'Cancel',
                icon: 'none',
                type: '',
                size: 'middle',
                danger: false,
                disabled: false,
              },
            },
            {
              type: 'DuBoisButton',
              props: {
                id: 'btn-create',
                label: 'Create',
                icon: 'plus',
                type: 'primary',
                size: 'middle',
                danger: false,
                disabled: false,
              },
            },
          ],
        },
      },
    ],
  },
};
