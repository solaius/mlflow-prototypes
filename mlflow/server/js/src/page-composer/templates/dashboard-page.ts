import type { Data } from '@puckeditor/core';

export const dashboardPageTemplate: { name: string; description: string; data: Data } = {
  name: 'Dashboard',
  description: 'Stat cards in a row, two-column layout with chart areas and sidebar — monitoring overview pattern.',
  data: {
    root: { props: {} },
    content: [
      {
        type: 'DuBoisHeader',
        props: {
          id: 'header',
          title: 'Dashboard',
          buttons: [
            {
              type: 'DuBoisButton',
              props: {
                id: 'btn-refresh',
                label: 'Refresh',
                icon: 'none',
                type: '',
                size: 'middle',
                danger: false,
                disabled: false,
                loading: false,
              },
            },
          ],
          breadcrumbs: [],
          titleAddOns: [],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-1', size: 'sm', shrinks: true } },
      {
        type: 'DuBoisAlert',
        props: {
          id: 'status-alert',
          message: 'All systems operational',
          description: 'Last refreshed 5 minutes ago',
          type: 'success',
          closable: true,
          size: 'small',
          collapsible: false,
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-2', size: 'md', shrinks: true } },
      {
        type: 'Columns',
        props: {
          id: 'stat-cards',
          count: 3,
          gap: 'md',
          col1: [
            {
              type: 'DuBoisCard',
              props: {
                id: 'stat-card-1',
                width: '100%',
                disableHover: true,
                loading: false,
                padding: 'default',
                content: [
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'stat-label-1',
                      text: 'Total Runs',
                      variant: 'text',
                      level: 2,
                      bold: false,
                      color: 'secondary',
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'stat-value-1',
                      text: '1,247',
                      variant: 'title',
                      level: 2,
                      bold: false,
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                ],
              },
            },
          ],
          col2: [
            {
              type: 'DuBoisCard',
              props: {
                id: 'stat-card-2',
                width: '100%',
                disableHover: true,
                loading: false,
                padding: 'default',
                content: [
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'stat-label-2',
                      text: 'Success Rate',
                      variant: 'text',
                      level: 2,
                      bold: false,
                      color: 'secondary',
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'stat-value-2',
                      text: '94.2%',
                      variant: 'title',
                      level: 2,
                      bold: false,
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                ],
              },
            },
          ],
          col3: [
            {
              type: 'DuBoisCard',
              props: {
                id: 'stat-card-3',
                width: '100%',
                disableHover: true,
                loading: false,
                padding: 'default',
                content: [
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'stat-label-3',
                      text: 'Avg Latency',
                      variant: 'text',
                      level: 2,
                      bold: false,
                      color: 'secondary',
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'stat-value-3',
                      text: '245ms',
                      variant: 'title',
                      level: 2,
                      bold: false,
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      { type: 'DuBoisSpacer', props: { id: 'spacer-3', size: 'md', shrinks: true } },
      {
        type: 'Columns',
        props: {
          id: 'main-content',
          count: 2,
          gap: 'md',
          col1: [
            {
              type: 'DuBoisCard',
              props: {
                id: 'chart-card',
                width: '100%',
                disableHover: true,
                loading: false,
                padding: 'default',
                content: [
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'chart-title',
                      text: 'Request Volume',
                      variant: 'title',
                      level: 3,
                      bold: false,
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                  { type: 'DuBoisSpacer', props: { id: 'spacer-chart', size: 'md', shrinks: true } },
                  {
                    type: 'DuBoisEmpty',
                    props: {
                      id: 'chart-placeholder',
                      title: 'Chart Area',
                      description: 'Replace this with your chart component.',
                      image: 'none',
                    },
                  },
                ],
              },
            },
          ],
          col2: [
            {
              type: 'DuBoisCard',
              props: {
                id: 'sidebar-card',
                width: '100%',
                disableHover: true,
                loading: false,
                padding: 'default',
                content: [
                  {
                    type: 'DuBoisTypography',
                    props: {
                      id: 'sidebar-title',
                      text: 'Recent Activity',
                      variant: 'title',
                      level: 3,
                      bold: false,
                      withoutMargins: true,
                      size: 'md',
                    },
                  },
                  { type: 'DuBoisSpacer', props: { id: 'spacer-sidebar', size: 'sm', shrinks: true } },
                  {
                    type: 'ListItem',
                    props: {
                      id: 'activity-1',
                      title: 'Run #1247 completed',
                      subtitle: '2 minutes ago',
                      selected: false,
                      showChevron: false,
                      icon: 'play',
                    },
                  },
                  { type: 'Divider', props: { id: 'div-1' } },
                  {
                    type: 'ListItem',
                    props: {
                      id: 'activity-2',
                      title: 'Run #1246 failed',
                      subtitle: '15 minutes ago',
                      selected: false,
                      showChevron: false,
                      icon: 'danger',
                    },
                  },
                  { type: 'Divider', props: { id: 'div-2' } },
                  {
                    type: 'ListItem',
                    props: {
                      id: 'activity-3',
                      title: 'Model v3.2 registered',
                      subtitle: '1 hour ago',
                      selected: false,
                      showChevron: false,
                      icon: 'cloud',
                    },
                  },
                  { type: 'Divider', props: { id: 'div-3' } },
                  {
                    type: 'ListItem',
                    props: {
                      id: 'activity-4',
                      title: 'Endpoint scaled up',
                      subtitle: '2 hours ago',
                      selected: false,
                      showChevron: false,
                      icon: 'gear',
                    },
                  },
                  { type: 'Divider', props: { id: 'div-4' } },
                  {
                    type: 'ListItem',
                    props: {
                      id: 'activity-5',
                      title: 'Run #1245 completed',
                      subtitle: '3 hours ago',
                      selected: false,
                      showChevron: false,
                      icon: 'play',
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
