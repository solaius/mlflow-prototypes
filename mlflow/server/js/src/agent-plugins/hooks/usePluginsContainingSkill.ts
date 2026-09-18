import { useMemo } from 'react';

import { SkillStatus } from '../../skills-registry/types';
import { usePluginVersionsStore } from '../mocks/pluginsStore';
import type { AgentPluginVersionEntity } from '../types';
import { isSkillMember } from '../types';

/**
 * Reverse lookup: which agent plugin versions contain a given skill?
 *
 * RFC-0008 is explicit that this is a QUERY, not a stored field. Its UI section says to
 * "search agent plugins by member name rather than reading a stored field on the skill",
 * and the CLI exposes the same thing as
 * `mlflow agent-plugins search --filter-string "member_name = '...'"`. A skill therefore
 * never records its memberships, and anything showing them has to turn the membership
 * rows around, which is what this does.
 *
 * Membership is owned by the plugin: a plugin version pins a skill version, and the skill is
 * unaware. Storing the backlink on the skill would create a second copy of the truth that
 * has to be kept in step with every plugin write. Deriving it costs a scan and cannot drift.
 *
 * Reads registry records exclusively: no runtime data is consulted, and none is needed.
 */

export interface PluginSkillMembership {
  pluginVersion: AgentPluginVersionEntity;
  /** The skill version this plugin version pins. */
  pinnedSkillVersion: number;
}

/**
 * Every LIVE agent plugin version containing `qualifiedSkillName`. When `skillVersion` is
 * given, narrows to versions pinning that exact integer version. Sorted newest first.
 *
 * Soft-deleted plugin versions are excluded: their membership rows survive for the
 * referential check, but no read API returns them, so a skill page must not list them.
 */
export const usePluginsContainingSkill = (
  qualifiedSkillName?: string,
  skillVersion?: number,
): PluginSkillMembership[] => {
  const pluginVersions = usePluginVersionsStore();

  return useMemo(() => {
    if (!qualifiedSkillName) {
      return [];
    }
    const memberships: PluginSkillMembership[] = [];
    for (const pluginVersion of pluginVersions) {
      if (pluginVersion.status === SkillStatus.DELETED) {
        continue;
      }
      const member = pluginVersion.members.find((entry) => isSkillMember(entry) && entry.name === qualifiedSkillName);
      if (!member || !isSkillMember(member)) {
        continue;
      }
      if (skillVersion !== undefined && member.version !== skillVersion) {
        continue;
      }
      memberships.push({ pluginVersion, pinnedSkillVersion: member.version });
    }
    return memberships.sort((a, b) => b.pluginVersion.creation_timestamp - a.pluginVersion.creation_timestamp);
  }, [pluginVersions, qualifiedSkillName, skillVersion]);
};

/**
 * RFC-0010's blast-radius direction for MCP servers: every live plugin version whose
 * membership references `serverName`, with the referenced version on each row. This is the
 * query "which plugins depend on this MCP server?" that cannot be answered while server
 * configuration is embedded in packages.
 */
export const usePluginsReferencingMCPServer = (
  serverName?: string,
  serverVersion?: string,
): { pluginVersion: AgentPluginVersionEntity; referencedVersion?: string }[] => {
  const pluginVersions = usePluginVersionsStore();

  return useMemo(() => {
    if (!serverName) {
      return [];
    }
    const references: { pluginVersion: AgentPluginVersionEntity; referencedVersion?: string }[] = [];
    for (const pluginVersion of pluginVersions) {
      if (pluginVersion.status === SkillStatus.DELETED) {
        continue;
      }
      const member = pluginVersion.members.find(
        (entry) => entry.member_type === 'mcp-server' && entry.name === serverName,
      );
      if (!member) {
        continue;
      }
      if (serverVersion !== undefined && member.version !== serverVersion) {
        continue;
      }
      references.push({
        pluginVersion,
        referencedVersion: typeof member.version === 'string' ? member.version : undefined,
      });
    }
    return references.sort((a, b) => b.pluginVersion.creation_timestamp - a.pluginVersion.creation_timestamp);
  }, [pluginVersions, serverName, serverVersion]);
};
