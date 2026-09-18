import { createLazyRouteElement, type DocumentTitleHandle } from '../common/utils/RoutingUtils';

import { AgentPluginsPageId, AgentPluginsRoutePaths } from './routes';

export const getRouteDefs = () => [
  {
    path: AgentPluginsRoutePaths.pluginListPage,
    element: createLazyRouteElement(() => import('./components/AgentPluginListPage')),
    pageId: AgentPluginsPageId.pluginListPage,
    handle: { getPageTitle: () => 'Agent plugins' } satisfies DocumentTitleHandle,
  },
  {
    path: AgentPluginsRoutePaths.pluginPage,
    element: createLazyRouteElement(() => import('./components/AgentPluginPage')),
    pageId: AgentPluginsPageId.pluginPage,
    handle: { getPageTitle: (params) => `Agent plugin: ${params['pluginName']}` } satisfies DocumentTitleHandle,
  },
  {
    path: AgentPluginsRoutePaths.pluginVersionPage,
    element: createLazyRouteElement(() => import('./components/AgentPluginPage')),
    pageId: AgentPluginsPageId.pluginVersionPage,
    handle: {
      getPageTitle: (params) => `${params['pluginName']} ${params['version']}`,
    } satisfies DocumentTitleHandle,
  },
];
