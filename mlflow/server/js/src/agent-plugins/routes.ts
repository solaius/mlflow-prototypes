import { createMLflowRoutePath, generatePath } from '../common/utils/RoutingUtils';
import { parseSkillQualifiedName } from '../skills-registry/constants';
import { getPluginQualifiedName } from './constants';

export enum AgentPluginsPageId {
  pluginListPage = 'mlflow.agent-plugins.plugin-list',
  pluginPage = 'mlflow.agent-plugins.plugin-page',
  pluginVersionPage = 'mlflow.agent-plugins.plugin-version-page',
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- matches SkillsRegistryRoutePaths
export class AgentPluginsRoutePaths {
  static get pluginListPage() {
    return createMLflowRoutePath('/agent-plugins');
  }
  static get pluginPage() {
    return createMLflowRoutePath('/agent-plugins/:pluginName');
  }
  static get pluginVersionPage() {
    return createMLflowRoutePath('/agent-plugins/:pluginName/versions/:version');
  }
}

/**
 * The route param is the qualified `@org/name` reference, URI-encoded so its slash survives
 * as one segment -- the same shape the skills registry routes on, so the two read alike in
 * the address bar as well as on the page.
 */
const encodePluginParam = (organization: string, name: string) =>
  encodeURIComponent(getPluginQualifiedName(organization, name));

/** Parses a decoded `:pluginName` route param back into `{ organization, name }`. */
export const parsePluginParam = (param: string): { organization: string; name: string } =>
  parseSkillQualifiedName(param);

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- matches SkillsRegistryRoutes
export class AgentPluginsRoutes {
  static get pluginListPageRoute() {
    return AgentPluginsRoutePaths.pluginListPage;
  }
  static getPluginPageRoute(organization: string, name: string) {
    return generatePath(AgentPluginsRoutePaths.pluginPage, {
      pluginName: encodePluginParam(organization, name),
    });
  }
  static getPluginVersionPageRoute(organization: string, name: string, version: string) {
    return generatePath(AgentPluginsRoutePaths.pluginVersionPage, {
      pluginName: encodePluginParam(organization, name),
      version: encodeURIComponent(version),
    });
  }
}
