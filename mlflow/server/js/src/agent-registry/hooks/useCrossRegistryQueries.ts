import { useMemo } from 'react';

import { usePluginVersionsStore } from '../../agent-plugins/mocks/pluginsStore';
import { isSkillMember } from '../../agent-plugins/types';
import { SkillStatus } from '../../skills-registry/types';
import { getAgentQualifiedName } from '../constants';
import { useAgentVersionsStore } from '../mocks/agentsStore';
import { AgentStatus } from '../types';

/**
 * Cross-registry reverse-lookup queries computed entirely over registry records: the BOM
 * each agent version records. These power the "used by agent" filter on the skill list and
 * the "uses skill" side of the agent list.
 *
 * RFC-0011's blast-radius journey adds one rule the earlier lookups lacked: "agent plugin
 * references expand through their members ... so the query also finds agents that consume
 * a skill through a plugin". The expansion is applied here, once, so every consumer of
 * "which agents use skill X" gets the same answer.
 */

/** Live plugin versions keyed `@org/name@version`, with the qualified skill names they contain. */
const usePluginMembersByKey = (): Map<string, Set<string>> => {
  const pluginVersions = usePluginVersionsStore();
  return useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const pluginVersion of pluginVersions) {
      if (pluginVersion.status === SkillStatus.DELETED) {
        continue;
      }
      const key = `${pluginVersion.organization ? `@${pluginVersion.organization}/` : ''}${pluginVersion.name}@${pluginVersion.version}`;
      map.set(key, new Set(pluginVersion.members.filter(isSkillMember).map((member) => member.name)));
    }
    return map;
  }, [pluginVersions]);
};

/** Qualified agent names (`@org/name`) that pin `skillName` directly OR through a referenced plugin, in any live version. */
export const useAgentNamesUsingSkill = (skillName?: string): Set<string> => {
  const agentVersions = useAgentVersionsStore();
  const pluginMembers = usePluginMembersByKey();
  return useMemo(() => {
    const names = new Set<string>();
    if (!skillName) {
      return names;
    }
    for (const version of agentVersions) {
      if (version.status === AgentStatus.DELETED) {
        continue;
      }
      const direct = version.bom.skills.some((ref) => ref.name === skillName);
      const viaPlugin = version.bom.agent_plugins.some((ref) =>
        pluginMembers.get(`${ref.name}@${ref.version}`)?.has(skillName),
      );
      if (direct || viaPlugin) {
        names.add(getAgentQualifiedName(version.organization, version.name));
      }
    }
    return names;
  }, [agentVersions, pluginMembers, skillName]);
};

/**
 * Skill names pinned by `qualifiedAgentName`, directly or through its plugins, narrowed to
 * `agentVersion` when one is given. Drives the skill list's "used by agent" filter.
 */
export const useSkillNamesUsedByAgent = (qualifiedAgentName?: string, agentVersion?: string): Set<string> => {
  const agentVersions = useAgentVersionsStore();
  const pluginMembers = usePluginMembersByKey();
  return useMemo(() => {
    const names = new Set<string>();
    if (!qualifiedAgentName) {
      return names;
    }
    for (const version of agentVersions) {
      if (version.status === AgentStatus.DELETED) {
        continue;
      }
      if (getAgentQualifiedName(version.organization, version.name) !== qualifiedAgentName) {
        continue;
      }
      if (agentVersion && version.version !== agentVersion) {
        continue;
      }
      for (const ref of version.bom.skills) {
        names.add(ref.name);
      }
      for (const ref of version.bom.agent_plugins) {
        for (const member of pluginMembers.get(`${ref.name}@${ref.version}`) ?? []) {
          names.add(member);
        }
      }
    }
    return names;
  }, [agentVersions, pluginMembers, qualifiedAgentName, agentVersion]);
};

/** Distinct skill names pinned by at least one live agent version. */
export const usePinnedSkillNames = (): string[] => {
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    const names = new Set<string>();
    for (const version of agentVersions) {
      if (version.status === AgentStatus.DELETED) {
        continue;
      }
      for (const ref of version.bom.skills) {
        names.add(ref.name);
      }
    }
    return Array.from(names).sort();
  }, [agentVersions]);
};

export interface AgentFilterOption {
  /** The `@org/name` reference, which is both the label and the filter value. */
  agentName: string;
  versions: string[];
}

/** Agents and their live versions, for the skill list's "used by agent" and version filters. */
export const useAgentFilterOptions = (): AgentFilterOption[] => {
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    const versionsByAgent = new Map<string, string[]>();
    for (const version of agentVersions) {
      if (version.status === AgentStatus.DELETED) {
        continue;
      }
      const key = getAgentQualifiedName(version.organization, version.name);
      versionsByAgent.set(key, [...(versionsByAgent.get(key) ?? []), version.version]);
    }
    return Array.from(versionsByAgent.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([agentName, versions]) => ({ agentName, versions }));
  }, [agentVersions]);
};

/** Live agent versions whose BOM references `serverName` (optionally at `serverVersion`). */
export const useAgentsUsingMCPServer = (serverName?: string, serverVersion?: string) => {
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    if (!serverName) {
      return [];
    }
    return agentVersions
      .filter(
        (version) =>
          version.status !== AgentStatus.DELETED &&
          version.bom.mcp_servers.some(
            (ref) => ref.name === serverName && (serverVersion === undefined || ref.version === serverVersion),
          ),
      )
      .map((version) => ({
        agentOrganization: version.organization,
        agentName: version.name,
        agentVersion: version,
        pinnedServerVersion: version.bom.mcp_servers.find((ref) => ref.name === serverName)?.version,
      }))
      .sort((a, b) => b.agentVersion.creation_timestamp - a.agentVersion.creation_timestamp);
  }, [agentVersions, serverName, serverVersion]);
};

/** Live agent versions that call `qualifiedAgentName`: "which agents call the compromised agent?" */
export const useAgentsCallingAgent = (qualifiedAgentName?: string, version?: string) => {
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    if (!qualifiedAgentName) {
      return [];
    }
    return agentVersions
      .filter(
        (entry) =>
          entry.status !== AgentStatus.DELETED &&
          entry.bom.agents.some(
            (ref) =>
              ref.name === qualifiedAgentName && (version === undefined || !ref.version || ref.version === version),
          ),
      )
      .map((entry) => ({
        agentOrganization: entry.organization,
        agentName: entry.name,
        agentVersion: entry,
        pinnedVersion: entry.bom.agents.find((ref) => ref.name === qualifiedAgentName)?.version,
      }))
      .sort((a, b) => b.agentVersion.creation_timestamp - a.agentVersion.creation_timestamp);
  }, [agentVersions, qualifiedAgentName, version]);
};
