import { useMemo } from 'react';

import { useAgentVersionsStore } from '../../agent-registry/mocks/agentsStore';
import type { AgentVersionEntity } from '../../agent-registry/types';
import { AgentStatus } from '../../agent-registry/types';

/**
 * Reverse lookup: which registered agent versions reference a given agent plugin?
 *
 * RFC-0011's BOM carries agent plugin references as a first-class axis ("a plugin is
 * referenced as a composed unit and expands through its registered members for queries").
 * This is the direct half: agents that name the plugin itself. The expansion half -- an
 * agent that consumes a skill THROUGH a plugin -- lives in the agent registry's own
 * cross-registry hooks, where the skill page reads it.
 *
 * Runs over registry records only. Withdrawn agent versions are not returned.
 */

export interface AgentPluginUsage {
  agentOrganization: string;
  agentName: string;
  agentVersion: AgentVersionEntity;
  pinnedPluginVersion: string;
}

export const useAgentsUsingPlugin = (qualifiedPluginName?: string, pluginVersion?: string): AgentPluginUsage[] => {
  const agentVersions = useAgentVersionsStore();

  return useMemo(() => {
    if (!qualifiedPluginName) {
      return [];
    }
    const usages: AgentPluginUsage[] = [];
    for (const agentVersion of agentVersions) {
      if (agentVersion.status === AgentStatus.DELETED) {
        continue;
      }
      const ref = agentVersion.bom.agent_plugins.find((entry) => entry.name === qualifiedPluginName);
      if (!ref) {
        continue;
      }
      if (pluginVersion !== undefined && ref.version !== pluginVersion) {
        continue;
      }
      usages.push({
        agentOrganization: agentVersion.organization,
        agentName: agentVersion.name,
        agentVersion,
        pinnedPluginVersion: ref.version,
      });
    }
    return usages.sort((a, b) => b.agentVersion.creation_timestamp - a.agentVersion.creation_timestamp);
  }, [agentVersions, qualifiedPluginName, pluginVersion]);
};
