import type { Data } from '@puckeditor/core';
import { listPageTemplate } from './list-page';
import { detailPageTemplate } from './detail-page';
import { dashboardPageTemplate } from './dashboard-page';
import { settingsPageTemplate } from './settings-page';
import { formPageTemplate } from './form-page';

export interface PageTemplate {
  name: string;
  description: string;
  data: Data;
}

export const templates: PageTemplate[] = [
  listPageTemplate,
  detailPageTemplate,
  dashboardPageTemplate,
  settingsPageTemplate,
  formPageTemplate,
];
