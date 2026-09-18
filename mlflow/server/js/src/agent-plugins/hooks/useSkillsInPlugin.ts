import { useMemo } from 'react';

import { SkillStatus } from '../../skills-registry/types';
import { getPluginQualifiedName } from '../constants';
import { usePluginVersionsStore } from '../mocks/pluginsStore';
import { isSkillMember } from '../types';

/**
 * The forward direction of `usePluginsContainingSkill`: given a plugin, which skills does
 * it contain?
 *
 * Added for the plugin filter on the skills list, decided at the 2026-09-04 working
 * session. Nana proposed the shape -- pick a plugin, see the skills inside it -- and
 * Juntao framed it as one more entry in the filter group already there.
 *
 * Note which direction this is. Filtering PLUGINS BY SKILL was ruled out on the same call:
 * Bill found that the API can filter on a member's skill name but not on the
 * organization/name pair that actually makes a skill unique, so two same-named skills in
 * different organizations cannot be told apart, and the client-side reconciliation gets
 * convoluted. This direction has no such problem, because a plugin's members already
 * record the qualified `@org/name` reference.
 */

/** Qualified skill names (`@org/name`) contained by any live version of the plugin `@org/name`. */
export const useSkillNamesInPlugin = (qualifiedPluginName?: string): Set<string> => {
  const pluginVersions = usePluginVersionsStore();

  return useMemo(() => {
    const names = new Set<string>();
    if (!qualifiedPluginName) {
      return names;
    }
    for (const pluginVersion of pluginVersions) {
      if (pluginVersion.status === SkillStatus.DELETED) {
        continue;
      }
      if (getPluginQualifiedName(pluginVersion.organization, pluginVersion.name) !== qualifiedPluginName) {
        continue;
      }
      for (const member of pluginVersion.members) {
        if (isSkillMember(member)) {
          names.add(member.name);
        }
      }
    }
    return names;
  }, [pluginVersions, qualifiedPluginName]);
};

/**
 * Plugins that contain at least one skill: the options for the filter.
 *
 * A plugin with no skill members is left out: selecting it could only ever produce an
 * empty list, so offering it is offering a dead end. Plugins can hold MCP servers and
 * nothing else, which is exactly the case this skips.
 */
export const usePluginFilterOptions = (): string[] => {
  const pluginVersions = usePluginVersionsStore();

  return useMemo(() => {
    const names = new Set<string>();
    for (const pluginVersion of pluginVersions) {
      if (pluginVersion.status !== SkillStatus.DELETED && pluginVersion.members.some(isSkillMember)) {
        names.add(getPluginQualifiedName(pluginVersion.organization, pluginVersion.name));
      }
    }
    return Array.from(names).sort();
  }, [pluginVersions]);
};
