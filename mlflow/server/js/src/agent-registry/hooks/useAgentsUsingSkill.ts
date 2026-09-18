import { useMemo } from 'react';

import { usePluginVersionsStore } from '../../agent-plugins/mocks/pluginsStore';
import { isSkillMember } from '../../agent-plugins/types';
import { SkillStatus } from '../../skills-registry/types';
import { useAgentVersionsStore } from '../mocks/agentsStore';
import type { AgentVersionEntity } from '../types';
import { AgentStatus } from '../types';

/**
 * Reverse lookup: which registered agent versions pin a given skill?
 *
 * This is the cross-registry query that makes a registry more than a list: "what is using
 * this?" is the question a skill owner asks before changing or deprecating anything, and
 * neither the skill itself nor the cluster can answer it. Only a registry that stores the
 * pins can.
 *
 * RFC-0011 expands agent plugin references through their members, so an agent that pins a
 * plugin containing the skill is a consumer too. Those rows carry `via` so the skill page
 * can say which plugin carried the skill in, which is what the owner needs to know to
 * decide whether the plugin's owner or the agent's owner is the one to talk to.
 *
 * Runs entirely over registry records: no runtime data is consulted and none is needed.
 */

export interface AgentSkillUsage {
  agentOrganization: string;
  agentName: string;
  agentVersion: AgentVersionEntity;
  /** The skill version this agent version pins, directly or through the plugin. */
  pinnedSkillVersion: number;
  /** Set when the pin arrives through a plugin reference rather than a direct skill reference. */
  via?: { pluginName: string; pluginVersion: string };
}

export const useAgentsUsingSkill = (skillName?: string, skillVersion?: number): AgentSkillUsage[] => {
  const agentVersions = useAgentVersionsStore();
  const pluginVersions = usePluginVersionsStore();

  return useMemo(() => {
    if (!skillName) {
      return [];
    }
    const pinnedVersionInPlugin = (pluginName: string, pluginVersion: string): number | undefined => {
      const plugin = pluginVersions.find(
        (entry) =>
          entry.status !== SkillStatus.DELETED &&
          `${entry.organization ? `@${entry.organization}/` : ''}${entry.name}` === pluginName &&
          entry.version === pluginVersion,
      );
      const member = plugin?.members.find((entry) => isSkillMember(entry) && entry.name === skillName);
      return member && isSkillMember(member) ? member.version : undefined;
    };

    const usages: AgentSkillUsage[] = [];
    for (const agentVersion of agentVersions) {
      if (agentVersion.status === AgentStatus.DELETED) {
        continue;
      }
      const direct = agentVersion.bom.skills.find((ref) => ref.name === skillName);
      if (direct && (skillVersion === undefined || direct.version === skillVersion)) {
        usages.push({
          agentOrganization: agentVersion.organization,
          agentName: agentVersion.name,
          agentVersion,
          pinnedSkillVersion: direct.version,
        });
        continue;
      }
      for (const pluginRef of agentVersion.bom.agent_plugins) {
        const pinned = pinnedVersionInPlugin(pluginRef.name, pluginRef.version);
        if (pinned !== undefined && (skillVersion === undefined || pinned === skillVersion)) {
          usages.push({
            agentOrganization: agentVersion.organization,
            agentName: agentVersion.name,
            agentVersion,
            pinnedSkillVersion: pinned,
            via: { pluginName: pluginRef.name, pluginVersion: pluginRef.version },
          });
          break;
        }
      }
    }
    return usages.sort((a, b) => b.agentVersion.creation_timestamp - a.agentVersion.creation_timestamp);
  }, [agentVersions, pluginVersions, skillName, skillVersion]);
};
