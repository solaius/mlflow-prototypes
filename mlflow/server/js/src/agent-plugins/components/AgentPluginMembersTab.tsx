import {
  Alert,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { MCP_SEEDS } from '../../mcp-registry/mocks/mcpSeeds';
import { parseSkillQualifiedName } from '../../skills-registry/constants';
import { SkillStatusTag } from '../../skills-registry/components/SkillCellRenderers';
import { useSkillVersionsStore } from '../../skills-registry/mocks/skillsStore';
import { SkillStatus } from '../../skills-registry/types';
import { PluginMemberChip } from './AgentPluginCellRenderers';
import type { AgentPluginMember, AgentPluginVersionEntity } from '../types';
import { isMCPServerMember, isSkillMember } from '../types';
import { formatMemberTypePlural, groupMembersByType, memberTypeTagColor } from '../utils';

/**
 * The members of one plugin version, grouped by type -- RFC-0010's "the plugin version
 * detail page shows members grouped by type", with RFC-0008's skill rows carrying the fact
 * the version pane most needs to expose: the lifecycle state of the pinned skill version,
 * and whether it has been deleted and so withdrawn this whole plugin version.
 *
 * Skill members link to the exact pinned skill version; MCP server members to the server
 * in the MCP registry when connected; other types are listed with their adapter-assigned
 * type and nothing to link to, because the plugin is their governance unit.
 */
export const AgentPluginMembersTab = ({
  pluginVersion,
  isWithdrawn,
}: {
  pluginVersion: AgentPluginVersionEntity;
  isWithdrawn: boolean;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const skillVersions = useSkillVersionsStore();

  const skillStatusByKey = useMemo(() => {
    const map = new Map<string, SkillStatus>();
    for (const entry of skillVersions) {
      map.set(`${entry.organization}/${entry.name}@${entry.version}`, entry.status);
    }
    return map;
  }, [skillVersions]);

  const groups = groupMembersByType(pluginVersion.members);

  if (!groups.length) {
    return (
      <div
        css={{
          padding: theme.spacing.sm,
          borderRadius: theme.borders.borderRadiusSm,
          backgroundColor: theme.colors.backgroundSecondary,
        }}
      >
        <Typography.Text color="secondary">
          <FormattedMessage
            defaultMessage="This version has no members. A valid package with no skills is still registered."
            description="Agent plugins > members tab > empty state"
          />
        </Typography.Text>
      </div>
    );
  }

  const statusFor = (member: AgentPluginMember): SkillStatus | undefined => {
    if (!isSkillMember(member)) {
      return undefined;
    }
    const { organization, name } = parseSkillQualifiedName(member.name);
    return skillStatusByKey.get(`${organization}/${name}@${member.version}`);
  };

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {isWithdrawn && (
        <Alert
          componentId="mlflow.agent-plugins.members.withdrawn"
          type="warning"
          closable={false}
          message={intl.formatMessage({
            defaultMessage: 'This version is withdrawn',
            description: 'Agent plugins > members tab > withdrawn alert title',
          })}
          description={intl.formatMessage({
            defaultMessage:
              'A member skill version below was deleted. Until a new plugin version references a replacement, this one does not resolve, is hidden from discovery, and cannot be pulled.',
            description: 'Agent plugins > members tab > withdrawn alert description',
          })}
          css={{ maxWidth: 720 }}
        />
      )}

      {groups.map(({ memberType, members }) => (
        <div key={memberType}>
          <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <Typography.Title level={4} withoutMargins>
              {formatMemberTypePlural(memberType)}
            </Typography.Title>
            <Tag componentId="mlflow.agent-plugins.members.group-count" color={memberTypeTagColor(memberType)}>
              {members.length}
            </Tag>
          </div>
          <Table data-testid={`plugin-members-${memberType}`} scrollable>
            <TableRow isHeader>
              <TableHeader componentId="mlflow.agent-plugins.members.header-name">
                <FormattedMessage defaultMessage="Member" description="Members table > name column" />
              </TableHeader>
              <TableHeader componentId="mlflow.agent-plugins.members.header-pin" css={{ maxWidth: 160 }}>
                <FormattedMessage defaultMessage="Pinned version" description="Members table > pinned version column" />
              </TableHeader>
              <TableHeader componentId="mlflow.agent-plugins.members.header-state" css={{ maxWidth: 220 }}>
                <FormattedMessage defaultMessage="State" description="Members table > state column" />
              </TableHeader>
            </TableRow>
            {members.map((member) => {
              const skillStatus = statusFor(member);
              const registeredServer = isMCPServerMember(member)
                ? MCP_SEEDS.some((entry) => entry.server.name === member.name)
                : false;
              return (
                <TableRow key={`${member.member_type}:${member.name}`}>
                  <TableCell ellipsis>
                    <PluginMemberChip member={member} />
                  </TableCell>
                  <TableCell ellipsis css={{ maxWidth: 160 }}>
                    {member.version !== undefined ? (
                      <Typography.Text code>{String(member.version)}</Typography.Text>
                    ) : (
                      <Typography.Text color="secondary">&mdash;</Typography.Text>
                    )}
                  </TableCell>
                  <TableCell ellipsis css={{ maxWidth: 220 }}>
                    {isSkillMember(member) ? (
                      skillStatus === undefined ? (
                        <Typography.Text color="secondary" size="sm">
                          <FormattedMessage
                            defaultMessage="Not registered"
                            description="Members table > skill missing"
                          />
                        </Typography.Text>
                      ) : skillStatus === SkillStatus.DELETED ? (
                        <Tag componentId="mlflow.agent-plugins.members.deleted" color="coral">
                          <FormattedMessage
                            defaultMessage="Deleted, withdraws this version"
                            description="Members table > skill member deleted"
                          />
                        </Tag>
                      ) : (
                        <SkillStatusTag status={skillStatus} />
                      )
                    ) : isMCPServerMember(member) ? (
                      <Typography.Text color="secondary" size="sm">
                        {member.version && registeredServer ? (
                          <FormattedMessage
                            defaultMessage="Connected to the MCP registry"
                            description="Members table > MCP member connected"
                          />
                        ) : (
                          <FormattedMessage
                            defaultMessage="Discovered from mcp.json, not connected"
                            description="Members table > MCP member unconnected"
                          />
                        )}
                      </Typography.Text>
                    ) : (
                      <Typography.Text color="secondary" size="sm">
                        <FormattedMessage
                          defaultMessage="Governed through this plugin"
                          description="Members table > generic member state"
                        />
                      </Typography.Text>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </div>
      ))}
    </div>
  );
};
