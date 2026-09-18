import { createMLflowRoutePath, generatePath } from '../common/utils/RoutingUtils';
import { getAgentQualifiedName } from './constants';

export enum AgentRegistryPageId {
  agentListPage = 'mlflow.agent-registry.agent-list',
  agentPage = 'mlflow.agent-registry.agent-page',
  agentVersionPage = 'mlflow.agent-registry.agent-version-page',
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- matches SkillsRegistryRoutePaths
export class AgentRegistryRoutePaths {
  static get agentListPage() {
    return createMLflowRoutePath('/agents');
  }
  static get agentPage() {
    return createMLflowRoutePath('/agents/:agentName');
  }
  static get agentVersionPage() {
    return createMLflowRoutePath('/agents/:agentName/versions/:version');
  }
}

/**
 * The route param is the qualified `@org/name`, URI-encoded so its slash survives as one
 * segment, and the version is a nested segment -- the same shape the skill and plugin
 * registries route on, so the three read alike in the address bar as well as on the page.
 */
const encodeAgentParam = (organization: string, agentName: string) =>
  encodeURIComponent(getAgentQualifiedName(organization, agentName));

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- matches SkillsRegistryRoutes
export class AgentRegistryRoutes {
  static get agentListPageRoute() {
    return AgentRegistryRoutePaths.agentListPage;
  }
  /** With a version, the versioned route; callers that carried `?version=` before keep working. */
  static getAgentPageRoute(organization: string, agentName: string, version?: string) {
    if (version) {
      return AgentRegistryRoutes.getAgentVersionPageRoute(organization, agentName, version);
    }
    return generatePath(AgentRegistryRoutePaths.agentPage, { agentName: encodeAgentParam(organization, agentName) });
  }
  static getAgentVersionPageRoute(organization: string, agentName: string, version: string) {
    return generatePath(AgentRegistryRoutePaths.agentVersionPage, {
      agentName: encodeAgentParam(organization, agentName),
      version: encodeURIComponent(version),
    });
  }
}
