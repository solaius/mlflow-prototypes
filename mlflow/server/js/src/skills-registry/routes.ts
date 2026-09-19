import { createMLflowRoutePath, generatePath } from '../common/utils/RoutingUtils';

import { getSkillQualifiedName } from './constants';

export enum SkillsRegistryPageId {
  skillListPage = 'mlflow.skills-registry.skill-list',
  skillPage = 'mlflow.skills-registry.skill-page',
  skillVersionPage = 'mlflow.skills-registry.skill-version-page',
}

/**
 * Route path definitions (used in defining route elements).
 *
 * `:skillKey` carries the qualified identifier `@{organization}/{name}`, URL-encoded,
 * or a bare `{name}` when the skill is unscoped. That mirrors RFC-0008's REST path
 * `/@{organization}/{name}` rather than inventing a second addressing scheme for the
 * UI, and it keeps a single path parameter for what is a composite key.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- matches ModelRegistryRoutePaths
export class SkillsRegistryRoutePaths {
  static get skillListPage() {
    return createMLflowRoutePath('/skills');
  }
  static get skillPage() {
    return createMLflowRoutePath('/skills/:skillKey');
  }
  static get skillVersionPage() {
    return createMLflowRoutePath('/skills/:skillKey/versions/:version');
  }
}

// Concrete routes and functions for generating parametrized paths
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- matches ModelRegistryRoutes
export class SkillsRegistryRoutes {
  static get skillListPageRoute() {
    return SkillsRegistryRoutePaths.skillListPage;
  }
  static getSkillPageRoute(organization: string, name: string) {
    return generatePath(SkillsRegistryRoutePaths.skillPage, {
      skillKey: encodeURIComponent(getSkillQualifiedName(organization, name)),
    });
  }
  static getSkillVersionPageRoute(organization: string, name: string, version: number | string) {
    return generatePath(SkillsRegistryRoutePaths.skillVersionPage, {
      skillKey: encodeURIComponent(getSkillQualifiedName(organization, name)),
      version: String(version),
    });
  }
}
