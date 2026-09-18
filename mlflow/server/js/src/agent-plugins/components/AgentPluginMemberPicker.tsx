import { useDesignSystemTheme } from '@databricks/design-system';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { RefLinkSection } from '../../common/components/RefLinkSection';
import type { BrowsableItem } from '../../common/components/RefLinkSection';
import { MCP_SEEDS } from '../../mcp-registry/mocks/mcpSeeds';
import { getSkillQualifiedName } from '../../skills-registry/constants';
import { useSkillsStore, useSkillVersionsStore } from '../../skills-registry/mocks/skillsStore';
import { SkillStatus } from '../../skills-registry/types';
import type { MCPServerMemberInput, SkillMemberInput } from '../mocks/pluginsStore';

/**
 * The member half of an assembled registration: registered skills and registered MCP
 * servers, each through the shared `RefLinkSection`, the same control the agent
 * registry links its BOM with.
 *
 * Skills are offered at their latest ACTIVE version, and only skills that have one. That
 * is RFC-0008's name-only resolution rule made visible: a member reference is frozen at
 * create time and never freezes a draft or a deprecated version, so a skill with no active
 * version is not a member the form can add. The version shown on the row is the pin the
 * registry will store.
 *
 * MCP servers are RFC-0010's addition. The reference is `mcp-servers:/name/version` into
 * the MCP Server Registry; MLflow stores the cross-registry reference, never a copy of the
 * server's configuration.
 */
export const AgentPluginMemberPicker = ({
  componentId,
  skills,
  mcpServers,
  onSkillsChange,
  onMCPServersChange,
}: {
  componentId: string;
  skills: SkillMemberInput[];
  mcpServers: MCPServerMemberInput[];
  onSkillsChange: (skills: SkillMemberInput[]) => void;
  onMCPServersChange: (servers: MCPServerMemberInput[]) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const allSkills = useSkillsStore();
  const allSkillVersions = useSkillVersionsStore();

  const skillEntities = useMemo(() => {
    const latestActive = new Map<string, number>();
    for (const version of allSkillVersions) {
      if (version.status !== SkillStatus.ACTIVE) {
        continue;
      }
      const key = getSkillQualifiedName(version.organization, version.name);
      latestActive.set(key, Math.max(latestActive.get(key) ?? 0, version.version));
    }
    return allSkills
      .map((skill) => {
        const name = getSkillQualifiedName(skill.organization, skill.name);
        const version = latestActive.get(name);
        return version === undefined
          ? undefined
          : { name, description: skill.description, latestVersion: String(version) };
      })
      .filter((entity): entity is BrowsableItem => Boolean(entity))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allSkills, allSkillVersions]);

  const mcpEntities = useMemo(
    () =>
      MCP_SEEDS.map((entry) => ({
        name: entry.server.name,
        description: entry.server.description ?? '',
        latestVersion: entry.server.latest_version ?? '',
      })).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'Skill members',
            description: 'Label for the plugin member skill picker',
          })}
          componentId={`${componentId}.skills`}
          browsableItems={skillEntities}
          items={skills.map((entry) => ({ name: entry.name, version: String(entry.version ?? '') }))}
          onAdd={(entity) => onSkillsChange([...skills, { name: entity.name, version: Number(entity.version) }])}
          onRemove={(index) => onSkillsChange(skills.filter((_, i) => i !== index))}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registered skills',
            description: 'Placeholder for the plugin member skill picker',
          })}
          hint={intl.formatMessage({
            defaultMessage:
              'Pinned to the latest active version of each skill, frozen when the version is created. Skills with no active version are not offered.',
            description: 'Hint for the plugin member skill picker',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No skill has an active version yet.',
            description: 'Empty state for the plugin member skill picker',
          })}
        />
      </div>

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'MCP server members',
            description: 'Label for the plugin MCP server picker',
          })}
          componentId={`${componentId}.mcp-servers`}
          browsableItems={mcpEntities}
          items={mcpServers.map((entry) => ({ name: entry.name, version: entry.version ?? '' }))}
          onAdd={(entity) => onMCPServersChange([...mcpServers, { name: entity.name, version: entity.version }])}
          onRemove={(index) => onMCPServersChange(mcpServers.filter((_, i) => i !== index))}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registered MCP servers',
            description: 'Placeholder for the plugin MCP server picker',
          })}
          hint={intl.formatMessage({
            defaultMessage:
              'A reference into the MCP Server Registry at a registered version. The registry stores the reference, not the server configuration.',
            description: 'Hint for the plugin MCP server picker',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No MCP servers are registered yet.',
            description: 'Empty state for the plugin MCP server picker',
          })}
        />
      </div>
    </div>
  );
};
