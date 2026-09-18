import { createLazyRouteElement, type DocumentTitleHandle } from '../common/utils/RoutingUtils';

import { AgentRegistryPageId, AgentRegistryRoutePaths } from './routes';

export const getRouteDefs = () => [
  {
    path: AgentRegistryRoutePaths.agentListPage,
    element: createLazyRouteElement(() => import('./components/AgentListPage')),
    pageId: AgentRegistryPageId.agentListPage,
    handle: { getPageTitle: () => 'Agents' } satisfies DocumentTitleHandle,
  },
  {
    path: AgentRegistryRoutePaths.agentPage,
    element: createLazyRouteElement(() => import('./components/AgentPage')),
    pageId: AgentRegistryPageId.agentPage,
    handle: { getPageTitle: (params) => `Agent: ${params['agentName']}` } satisfies DocumentTitleHandle,
  },
  {
    path: AgentRegistryRoutePaths.agentVersionPage,
    element: createLazyRouteElement(() => import('./components/AgentPage')),
    pageId: AgentRegistryPageId.agentVersionPage,
    handle: { getPageTitle: (params) => `${params['agentName']} v${params['version']}` } satisfies DocumentTitleHandle,
  },
];
