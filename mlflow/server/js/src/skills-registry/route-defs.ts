import { createLazyRouteElement, type DocumentTitleHandle } from '../common/utils/RoutingUtils';

import { SkillsRegistryPageId, SkillsRegistryRoutePaths } from './routes';

export const getRouteDefs = () => [
  {
    path: SkillsRegistryRoutePaths.skillListPage,
    element: createLazyRouteElement(() => import('./components/SkillListPage')),
    pageId: SkillsRegistryPageId.skillListPage,
    handle: { getPageTitle: () => 'Skills' } satisfies DocumentTitleHandle,
  },
  {
    path: SkillsRegistryRoutePaths.skillPage,
    element: createLazyRouteElement(() => import('./components/SkillPage')),
    pageId: SkillsRegistryPageId.skillPage,
    handle: {
      getPageTitle: (params) => `Skill: ${decodeURIComponent(params['skillKey'] ?? '')}`,
    } satisfies DocumentTitleHandle,
  },
  {
    // Retired as a standalone page in the prompts-style rework — `SkillPage` now
    // handles both the versionless and versioned routes, rendering the rail with
    // this version pre-selected via the `:version` path param.
    path: SkillsRegistryRoutePaths.skillVersionPage,
    element: createLazyRouteElement(() => import('./components/SkillPage')),
    pageId: SkillsRegistryPageId.skillVersionPage,
    handle: {
      getPageTitle: (params) => `${decodeURIComponent(params['skillKey'] ?? '')} v${params['version']}`,
    } satisfies DocumentTitleHandle,
  },
];
